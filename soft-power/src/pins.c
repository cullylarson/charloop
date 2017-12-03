#include <avr/io.h>
#include "pins.h"

void setupPins() {
    // set output pins (high)
    PWR_DDR |= (1 << PWR);
    SHUTDOWN_DDR |= (1 << SHUTDOWN);
    LED_DDR |= (1 << LED);
    RESET_DDR |= (1 << RESET);

    // set input pins (low)
    ONOFF_DDR &= ~(1 << ONOFF);
    STATUS_DDR &= ~(1 << STATUS);

    // start low, which disables the pull-up resistors, and also means that reading a 1 indicates button pressed and reading 0 indicates no button pressed
    ONOFF_PORT &= ~(1 << ONOFF);
    STATUS_PORT &= ~(1 << STATUS);
}
