#include <stdlib.h>
#include <stdint.h>
#include <avr/io.h>
#include <avr/interrupt.h>
#include <util/delay.h>
#include "pins.h"

// TODO -- add a timer for deciding whether to force power off if raspi hasn't shut down

enum State {
    S_INITIAL, // the initial state of the device, which is essentially off
    S_SHUTDOWN, // raspi is shut down
    S_ON_BOOTING, // power switch on, raspi is booting
    S_OFF_BOOTING, // power switch off, raspi is booting
    S_ON_RUNNING, // power switch is on, raspi is running
    S_OFF_RUNNING, // power switch is off, raspi is running
    S_STOPPING, // raspi is shutting down
};

enum State _currentState;

void setup();
uint8_t deviceOn();
uint8_t deviceOff();
void resetRaspi();
uint8_t raspiBooted();
uint8_t raspiIsShutdown();
void shutdownRaspi();
void cancelShutdown();
void powerRaspi();
void cutPower();

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
            case S_SHUTDOWN:
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
                }
                break;
            case S_OFF_BOOTING:
                if(deviceOn()) {
                    _currentState = S_ON_BOOTING;
                }
                else if(raspiBooted()) {
                    _currentState = S_OFF_RUNNING;
                }
                break;
            case S_ON_RUNNING:
                if(deviceOff()) {
                    _currentState = S_OFF_RUNNING;
                }
                break;
            case S_OFF_RUNNING:
                shutdownRaspi();
                // TODO -- start shutdown timer
                _currentState = S_STOPPING;
                break;
            case S_STOPPING:
                if(raspiIsShutdown()) {
                    // TODO -- cancel shutdown timer
                    if(deviceOn()) {
                        // the SHUTDOWN state will take care of starting back up (oddly enough)
                        _currentState = S_SHUTDOWN;
                    }
                    // device is off
                    else {
                        // this should completely turn everything off
                        cutPower();
                    }
                }
                // TODO -- if shutdown timer limit reached, force power off
                break;
        }
    }
}

void setup() {
    setupPins();

    sei();
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
    _delay_ms(10);
    GOLO(RESET_PORT, RESET);
}

uint8_t raspiBooted() {
    return READ(STATUS_IN, STATUS);
}

uint8_t raspiIsShutdown() {
    // TODO
    return 0; // stub
}

void shutdownRaspi() {
    GOHI(SHUTDOWN_PORT, SHUTDOWN);
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
