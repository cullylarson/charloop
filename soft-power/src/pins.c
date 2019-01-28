#include <avr/io.h>
#include "pins.h"

void setupPins() {
    // set output pins (high)
    PWR_DDR |= (1 << PWR);
    SHUTDOWN_DDR |= (1 << SHUTDOWN);
    LED_DDR |= (1 << LED);
    RESET_DDR |= (1 << RESET);
    BATT_STATUS_DATA_DDR |= (1 << BATT_STATUS_DATA);
    BATT_STATUS_CLK_DDR |= (1 << BATT_STATUS_CLK);

    // set input pins (low)
    ONOFF_DDR &= ~(1 << ONOFF);
    RBOOTED_DDR &= ~(1 << RBOOTED);
    RSTOPPED_DDR &= ~(1 << RSTOPPED);

    // start low, which disables the pull-up resistors
    ONOFF_PORT |= (0 << ONOFF);
    RBOOTED_PORT |= (0 << RBOOTED);
    RSTOPPED_PORT |= (0 << RSTOPPED);

    // the reset pin needs to be normally high
    GOHI(RESET_PORT, RESET);
}
