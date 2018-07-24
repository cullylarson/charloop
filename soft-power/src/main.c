#include <stdlib.h>
#include <stdint.h>
#include <avr/io.h>
#include <avr/interrupt.h>
#include <util/delay.h>
#include "pins.h"

// how long to wait to force a shutdown, in milliseconds
#define SHUTDOWN_TIME_LIMIT 25000

enum State {
    S_INITIAL, // the initial state of the device, which is essentially off
    S_DOWN, // raspi is shut down
    S_ON_BOOTING, // power switch on, raspi is booting
    S_OFF_BOOTING, // power switch off, raspi is booting
    S_ON_RUNNING, // power switch is on, raspi is running
    S_OFF_RUNNING, // power switch is off, raspi is running
    S_STOPPING, // raspi is shutting down
};

volatile uint16_t _shutdownTimer = 0;
volatile uint16_t _blinkTimer = 0;

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

int main(void) {
    setup();
    _currentState = S_INITIAL;

    while(1) {
        // this is all based on a state machine. there's a diagram in the repo (hopefully).
        switch(_currentState) {
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
                    if(deviceOn()) {
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
    setupTimer();

    sei();
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
    return !READ(RSTOPPED_IN, RSTOPPED);
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
