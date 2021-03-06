#include <stdlib.h>
#include <stdint.h>
#include <math.h>
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
#define BATTERY_VOLTAGE_FORCE_SHUTDOWN 652 // 652 is 8%
// difference between voltage measurements within which we'll
// consider the measurements "the same"
#define BATTERY_VOLTAGE_ACCEPTABLE_MEASURE_DIFF 3
// this value of the battery voltage ADC will be considered 100% battery
#define BATTERY_VOLTAGE_RANGE_HI 852 // battery voltage is 4.16V
// this value of the battery voltage ADC will be considered 0% battery
#define BATTERY_VOLTAGE_RANGE_LO 635 // battery voltage is 3.1V
// the number of times to read the voltage before deciding we have a good value
#define BATTERY_VOLTAGE_NUM_READS 3
// will value will be added to all battery ADC reads
#define BATTERY_ADC_OFFSET -23 // for some reason the ADC is a bit off. this eems to correct it.

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
volatile uint8_t _batterySendClock = 1; // start clock high

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
void sendBatteryStatus();
uint8_t getBatteryPercent();
void sendBatteryVoltage();
void sendBatteryPercent();
void sendPacket();
void sendSyncedPacket(uint16_t);
void sendSyncedPacketDouble(uint16_t, uint16_t);
void sendBatteryStatusBit(uint8_t);
uint16_t buildStateReport();
uint16_t buildIOReport();

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
                    // wait a little while to make sure the raspi is really shut down.
                    // this is necessary because the pin idicating shutdown goes low
                    // a few seconds before complete shutdown.
                    if(raspiIsShutdown()) {
                        _delay_ms(8000);
                    }

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

    batteryVoltage += BATTERY_ADC_OFFSET; // apply the offset

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
            || voltageDifference <= BATTERY_VOLTAGE_ACCEPTABLE_MEASURE_DIFF
        ) {
            // we've performed enough reads
            if(_batteryVoltageNumReads >= BATTERY_VOLTAGE_NUM_READS) {
                _batteryVoltageNumReads = 0;

                // finally, save the voltage
                _batteryVoltage = batteryVoltage;
                sendBatteryStatus();
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

void sendBatteryStatus() {
    // see description of sendBatteryPercent for why adding 1 to battery
    // sendSyncedPacketDouble(_batteryVoltage, getBatteryPercent() + 1);

    sendPacket(0); // stub
    sendPacket(_batteryVoltage); // stub
    sendPacket(getBatteryPercent() + 1); // stub
    sendPacket(buildStateReport()); // stub
    sendPacket(buildIOReport()); // stub
}

uint16_t buildStateReport() {
    uint16_t report = 0b0000001000000000;

    report |= 0b00000001 & ((_currentState == S_BATTERY_LOW)  << 0);
    report |= 0b00000010 & ((_currentState == S_STOPPING)     << 1);
    report |= 0b00000100 & ((_currentState == S_OFF_RUNNING)  << 2);
    report |= 0b00001000 & ((_currentState == S_ON_RUNNING)   << 3);
    report |= 0b00010000 & ((_currentState == S_OFF_BOOTING)  << 4);
    report |= 0b00100000 & ((_currentState == S_ON_BOOTING)   << 5);
    report |= 0b01000000 & ((_currentState == S_DOWN)         << 6);
    report |= 0b10000000 & ((_currentState == S_INITIAL)      << 7);

    return report;
}

uint16_t buildIOReport() {
    uint16_t report = 0b0000001000000000;

    report |= 0b00000001 & (deviceOn()          << 0);
    report |= 0b00000010 & (raspiBooted()       << 1);
    report |= 0b00000100 & (raspiIsShutdown()   << 2);

    return report;
}

uint8_t getBatteryPercent() {
    // anything below this is 0%
    if(_batteryVoltage <= BATTERY_VOLTAGE_RANGE_LO) return 0;
    // anything above this is 100%
    else if(_batteryVoltage >= BATTERY_VOLTAGE_RANGE_HI) return 100;
    // the percent relative to our min-max range
    else return floor((float) (_batteryVoltage - BATTERY_VOLTAGE_RANGE_LO) / (float) (BATTERY_VOLTAGE_RANGE_HI - BATTERY_VOLTAGE_RANGE_LO) * 100);
}

// send the raw battery voltage
void sendBatteryVoltage() {
    sendSyncedPacket(_batteryVoltage);
}

// send the battery voltage as a percentage. since cannot send 0 (see sendSyncedPacket),
// will send as a value between 1 and 101 (where 1 is 0% and 101 is 100%).
void sendBatteryPercent() {
    sendSyncedPacket(getBatteryPercent() + 1);
}

// sends a packet with a preamble to enable syncing on the receiving end.
// the preamble is just a packet with data of all 0s.
// will not allow a data value of 0 to be sent. if data is 0, will send 1 instead.
// this is because the sync packet is 0. if data could be 0 too, the data could be
// confused with the sync packet by the receiver.
void sendSyncedPacket(uint16_t data) {
    // data can't be 0
    if(data == 0) data = 1;

    sendPacket(0); // the sync packet
    sendPacket(data);
}

// sends two data packets after the preamble
void sendSyncedPacketDouble(uint16_t data1, uint16_t data2) {
    // data can't be 0
    if(data1 == 0) data1 = 1;
    if(data2 == 0) data2 = 1;

    sendPacket(0); // the sync packet
    sendPacket(data1);
    sendPacket(data2);
}

// send a packet of 10 bits. the format of the packet is 11<binary data>11
// will send the most significant digit of the binary data first.
void sendPacket(uint16_t data) {
    uint8_t bit;
    int8_t i; // can't be unsigned; needs to be able to go negative to exit loop

    // send two 1's
    sendBatteryStatusBit(1);
    sendBatteryStatusBit(1);

    // send the packet (most significant digit first)
    for(i = 9; i >= 0; i--) {
        bit = (data >> i) & 0b0000000001;
        sendBatteryStatusBit(bit);
    }

    // send two 1's
    sendBatteryStatusBit(1);
    sendBatteryStatusBit(1);
}

// sends a bit. flips the _batterySendClock bit AFTER sending.
void sendBatteryStatusBit(uint8_t bit) {
    // send the data bit first so it will be ready to read when the clock is sent
    if(bit) { GOHI(BATT_STATUS_DATA_PORT, BATT_STATUS_DATA); }
    else    { GOLO(BATT_STATUS_DATA_PORT, BATT_STATUS_DATA); }

    if(_batterySendClock) { GOHI(BATT_STATUS_CLK_PORT, BATT_STATUS_CLK); }
    else                  { GOLO(BATT_STATUS_CLK_PORT, BATT_STATUS_CLK); }

    _batterySendClock = !_batterySendClock;

    _delay_ms(10);
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
    GOLO(RESET_PORT, RESET);
    _delay_ms(100);
    GOHI(RESET_PORT, RESET);
}

uint8_t raspiBooted() {
    return READ(RBOOTED_IN, RBOOTED);
}

uint8_t raspiIsShutdown() {
    return !(READ(RSTOPPED_IN, RSTOPPED));
}

void shutdownRaspi() {
    GOHI(SHUTDOWN_PORT, SHUTDOWN);
    _delay_ms(1000);
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
