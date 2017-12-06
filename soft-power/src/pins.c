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
    RBOOTED_DDR &= ~(1 << RBOOTED);
    RSTOPPED_DDR &= ~(1 << RSTOPPED);

    // start high, which enables the pull-up resistors, and also means that reading a 0 indicates button pressed and reading 1 indicates no button pressed
    ONOFF_PORT |= (1 << ONOFF);
    RBOOTED_PORT |= (1 << RBOOTED);
    RSTOPPED_PORT |= (1 << RSTOPPED);
}
