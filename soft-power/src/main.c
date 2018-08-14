#include <stdlib.h>
#include <stdint.h>
#include <avr/io.h>
#include <avr/interrupt.h>
#include <util/delay.h>
#include "pins.h"

// the max value of the ADC
#define ADC_MAX 0b1111111111
// the max value of the ADC
#define ADC_MIN 0
// how long to wait to force a shutdown, in milliseconds
#define SHUTDOWN_TIME_LIMIT 35000
// how often to read the battery voltage
#define BATTERY_VOLTAGE_READ_FREQUENCY 5000
// the value of the battery voltage ADC when we should shut down
#define BATTERY_VOLTAGE_FORCE_SHUTDOWN 100 // TODO
// percentage difference between voltage measurements within which we'll
// consider the measurements "the same"
#define BATTERY_VOLTAGE_ACCEPTABLE_MEASURE_DIFF 0.05
// this value of the battery voltage ADC will be considered 100% battery
#define BATTERY_VOLTAGE_RANGE_HI 10000 // TODO
// this value of the battery voltage ADC will be considered 0% battery
#define BATTERY_VOLTAGE_RANGE_LO 1000 // TODO
// the number of times to read the voltage before deciding we have a good value
#define BATTERY_VOLTAGE_NUM_READS 3

enum State {
    S_INITIAL, // the initial state of the device, which is essentially off
    S_DOWN, // raspi is shut down
    S_ON_BOOTING, // power switch on, raspi is booting
    S_OFF_BOOTING, // power switch off, raspi is booting
    S_ON_RUNNING, // power switch is on, raspi is running
    S_OFF_RUNNING, // power switch is off, raspi is running
    S_STOPPING, // raspi is shutting down
    S_BATTERY_LOW, // battery is too low, don't start up
};

volatile uint16_t _shutdownTimer = 0;
volatile uint16_t _blinkTimer = 0;
volatile uint16_t _batteryVoltage = 0;
volatile uint16_t _batteryVoltageTemp = 0;
volatile uint16_t _batteryVoltageNumReads = 0;
volatile uint16_t _batteryVoltageReadTimer = 0;

volatile enum State _currentState;

void setup();
void setupTimer();
uint8_t deviceOn();
uint8_t deviceOff();
void resetRaspi();
uint8_t raspiBooted();
uint8_t raspiIsShutdown();
void shutdownRaspi();
void cancelShutdown();
void powerRaspi();
void cutPower();
uint8_t shutdownTimeReached();
void resetShutdownTimer();
void ledOn();
void ledOff();
void setupAdc();
void onBatteryVoltageUpdate(uint16_t);
void startAdcConversion();
uint8_t batteryTooLow();
void sendBatteryVoltage();
uint8_t sendBatteryVoltageBit(uint8_t, uint8_t);

int main(void) {
    setup();
    _currentState = S_INITIAL;

    // battery voltage is initialized to zero, so we're either waiting for the first read
    // or not starting if voltage is too low
    while(batteryTooLow());

    while(1) {
        // this is all based on a state machine. there's a diagram in the repo (hopefully).
        switch(_currentState) {
            case S_BATTERY_LOW:
                // never leave this state (force a power switch cycle)
                break;
            case S_INITIAL:
                // turned on
                if(deviceOn()) {
                    // make sure it's getting power, even if switch gets turned off
                    powerRaspi();
                    // this is the first time the device is powered on, so raspi should already
                    // be booting
                    _currentState = S_ON_BOOTING;
                }
                break;
            case S_DOWN:
                // turned on
                if(deviceOn()) {
                    // make sure it's getting power, even if switch gets turned off
                    powerRaspi();
                    // make sure we're no longer telling the raspi to shut down
                    cancelShutdown();
                    // start the raspi
                    resetRaspi();
                    _currentState = S_ON_BOOTING;
                }
                break;
            case S_ON_BOOTING:
                if(deviceOff()) {
                    _currentState = S_OFF_BOOTING;
                }
                else if(raspiBooted()) {
                    _currentState = S_ON_RUNNING;
                    ledOn();
                }
                break;
            case S_OFF_BOOTING:
                if(deviceOn()) {
                    _currentState = S_ON_BOOTING;
                }
                else if(raspiBooted()) {
                    _currentState = S_OFF_RUNNING;
                    ledOn();
                }
                break;
            case S_ON_RUNNING:
                if(deviceOff()) {
                    _currentState = S_OFF_RUNNING;
                }
                break;
            case S_OFF_RUNNING:
                shutdownRaspi();
                // the shutdown timer will start counting automatically once we transition, so reset it
                resetShutdownTimer();
                _currentState = S_STOPPING;
                break;
            case S_STOPPING:
                if(raspiIsShutdown() || shutdownTimeReached()) {
                    if(batteryTooLow()) {
                        // turn everything off, even if the power switch is on. entering
                        // the S_BATTERY_LOW state will keep us from starting up again.
                        cutPower();
                        _currentState = S_BATTERY_LOW;
                    }
                    else if(deviceOn()) {
                        // the DOWN state will take care of starting back up (oddly enough)
                        _currentState = S_DOWN;
                    }
                    // device is off
                    else {
                        // this should completely turn everything off
                        cutPower();
                    }
                }
                break;
        }
    }
}

void setup() {
    setupPins();
    setupAdc();
    setupTimer();

    sei();

    startAdcConversion();
}

void setupAdc() {
    // NOTE: Don't need to set the ADC pin as an input pin, though it doesn't change anything if you do

    // Vcc used as analog reference
    ADMUX &= ~((1 << REFS1) | (1 << REFS0));
    // Read from ADC4 (pin 9)
    ADMUX |= (1 << MUX2);

    // the adc needs to run sample at 50 - 200 kHz. Assuming the clock speed is 8MHz, will
    // need to scale down by 40. Closest, without sampling faster than 200 MHz is 64
    ADCSRA |= (1 << ADPS2) | (1 << ADPS1);

    // free running mode
    ADCSRB &= ~((1 << ADTS2) | (1 << ADTS1) | (1 << ADTS0));

    // enable adc, enable adc interrupts
    ADCSRA |= (1 << ADEN) | (1 << ADIE);
}

void startAdcConversion() {
    ADCSRA |= (1 << ADSC); // start conversion
}

// triggered when ADC is done
ISR(ADC_vect) {
    uint8_t low = ADCL; // need to read ADCL first (according to the datasheet)
    uint16_t batteryVoltage = (ADCH << 8) | low; // ADCH will have the left-most 2 bits, ADCL will have the right-most 8 bits (i.e. you get a 10-bit value)
    onBatteryVoltageUpdate(batteryVoltage);
}

void onBatteryVoltageUpdate(uint16_t batteryVoltage) {
    // we want to read the value a few times and make sure we get roughly the same value
    // each time before deciding we actually got a good read.

    uint16_t voltageDifference;

    _batteryVoltageNumReads++;

    // first read
    if(_batteryVoltageNumReads == 1) {
        _batteryVoltageTemp = batteryVoltage;
        // do another read
        _batteryVoltageReadTimer = 0;
        startAdcConversion();
    }
    else {
        voltageDifference = abs(_batteryVoltageTemp - batteryVoltage);

        // the percentage difference of the new reading to the last reading.
        // the value is close enough.
        if(
            (_batteryVoltageTemp == 0 && voltageDifference == 0)
            || (voltageDifference / _batteryVoltageTemp) <= BATTERY_VOLTAGE_ACCEPTABLE_MEASURE_DIFF
        ) {
            // we've performed enough reads
            if(_batteryVoltageNumReads >= BATTERY_VOLTAGE_NUM_READS) {
                _batteryVoltageNumReads = 0;

                // finally, save the voltage
                _batteryVoltage = batteryVoltage;
                sendBatteryVoltage();
            }
            // do another read
            else {
                _batteryVoltageTemp = batteryVoltage;
                _batteryVoltageReadTimer = 0;
                startAdcConversion();
            }
        }
        // not close enough, start over
        else {
            _batteryVoltageNumReads = 0;
            _batteryVoltageReadTimer = 0;
            startAdcConversion();
        }
    }
}

// send the battery voltage as a value between 0 and 100
// 100 is 0b1100100, so will need to send 7 bits.
// will send the least significant bit first.
void sendBatteryVoltage() {
    // start the clock high
    uint8_t clock = 1;
    uint8_t batteryBit;
    uint8_t i;

    // send three 1's
    clock = sendBatteryVoltageBit(1, clock);
    clock = sendBatteryVoltageBit(1, clock);
    clock = sendBatteryVoltageBit(1, clock);

    for(i = 0; i < 10; i++) {
        batteryBit = (_batteryVoltage >> i) & 0b0000000001;
        clock = sendBatteryVoltageBit(batteryBit, clock);
    }

    // end low
    sendBatteryVoltageBit(0, 0);
}

uint8_t sendBatteryVoltageBit(uint8_t bit, uint8_t clock) {
    if(clock) { GOHI(BATT_STATUS_CLK_PORT, BATT_STATUS_CLK); }
    else      { GOLO(BATT_STATUS_CLK_PORT, BATT_STATUS_CLK); }

    if(bit) { GOHI(BATT_STATUS_DATA_PORT, BATT_STATUS_DATA); }
    else    { GOLO(BATT_STATUS_DATA_PORT, BATT_STATUS_DATA); }

    _delay_ms(10);

    return !clock;
}

uint8_t batteryTooLow() {
    return _batteryVoltage < BATTERY_VOLTAGE_FORCE_SHUTDOWN;
}

void setupTimer() {
    // Timer/Counter 0

    // 1000 Hz (1000000/((124+1)*8))

    // CTC
    TCCR0A |= (1 << WGM01);

    // Prescaler 8
    TCCR0B |= (1 << CS01);

    // count to this value
    OCR0A = 124;

    // enable compare A match interrupt
    TIMSK0 |= (1 << OCIE0A);
}

// about 1000 times a second (i.e. once every 1ms)
ISR(TIM0_COMPA_vect) {
    // read the battery voltage every so often
    _batteryVoltageReadTimer++;
    if(_batteryVoltageReadTimer > BATTERY_VOLTAGE_READ_FREQUENCY) {
        _batteryVoltageReadTimer = 0;
        startAdcConversion();
    }

    if(_currentState == S_ON_BOOTING || _currentState == S_OFF_BOOTING || _currentState == S_STOPPING) {
        // if the current state is S_STOPPING, then we need to be counting for shutdown
        if(_currentState == S_STOPPING) {
            _shutdownTimer++;
        }

        _blinkTimer++;

        // blink the light
        if(_blinkTimer >= 700) {
            _blinkTimer = 0;
            TOGGLE(LED_PORT, LED);
        }
    }
}

uint8_t deviceOn() {
    return READ(ONOFF_IN, ONOFF);
}

uint8_t deviceOff() {
    return !deviceOn();
}

// tells the raspi to turn on, if it's shut down
void resetRaspi() {
    GOHI(RESET_PORT, RESET);
    _delay_ms(100);
    GOLO(RESET_PORT, RESET);
}

uint8_t raspiBooted() {
    return READ(RBOOTED_IN, RBOOTED);
}

uint8_t raspiIsShutdown() {
    return !(READ(RSTOPPED_IN, RSTOPPED));
}

void shutdownRaspi() {
    GOHI(SHUTDOWN_PORT, SHUTDOWN);
    _delay_ms(100);
    GOLO(SHUTDOWN_PORT, SHUTDOWN);
}

void cancelShutdown() {
    GOLO(SHUTDOWN_PORT, SHUTDOWN);
}

void powerRaspi() {
    GOHI(PWR_PORT, PWR);
}

void cutPower() {
    GOLO(PWR_PORT, PWR);
}

void ledOn() {
    GOHI(LED_PORT, LED);
}

void ledOff() {
    GOLO(LED_PORT, LED);
}

void resetShutdownTimer() {
    _shutdownTimer = 0;
}

uint8_t shutdownTimeReached() {
    return _shutdownTimer >= SHUTDOWN_TIME_LIMIT;
}
