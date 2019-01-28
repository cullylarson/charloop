#include <avr/io.h>

#ifndef PINS_H
#define PINS_H

// the main on/off indicator switch
#define ONOFF           PA2
#define ONOFF_PORT      PORTA
#define ONOFF_DDR       DDRA
#define ONOFF_IN        PINA

// booted status of raspi (i.e. whether it's fully booted). high means booted, low means not booted or not running
#define RBOOTED         PA1
#define RBOOTED_PORT    PORTA
#define RBOOTED_DDR     DDRA
#define RBOOTED_IN      PINA

// stopped status of raspi (i.e. whether it's stopped/shutdown). hight means on, low means off/shutdown/stopped
#define RSTOPPED        PA0
#define RSTOPPED_PORT   PORTA
#define RSTOPPED_DDR    DDRA
#define RSTOPPED_IN     PINA

// power the device (i.e. via relay or mosfet)
#define PWR             PA3
#define PWR_PORT        PORTA
#define PWR_DDR         DDRA
#define PWR_IN          PINA

// tell the raspi to shut down
#define SHUTDOWN        PB2
#define SHUTDOWN_PORT   PORTB
#define SHUTDOWN_DDR    DDRB
#define SHUTDOWN_IN     PINB

// an indicator LED
#define LED             PB0
#define LED_PORT        PORTB
#define LED_DDR         DDRB
#define LED_IN          PINB

// reset the raspi (tell it to turn on, if it's shut down)
#define RESET           PB1
#define RESET_PORT      PORTB
#define RESET_DDR       DDRB
#define RESET_IN        PINB

// sends battery level (data)
#define BATT_STATUS_DATA      PA7
#define BATT_STATUS_DATA_PORT PORTA
#define BATT_STATUS_DATA_DDR  DDRA
#define BATT_STATUS_DATA_IN   PINA

// sends battery level (clock)
#define BATT_STATUS_CLK      PA6
#define BATT_STATUS_CLK_PORT PORTA
#define BATT_STATUS_CLK_DDR  DDRA
#define BATT_STATUS_CLK_IN   PINA

// write digital "high" to pin <pn> on port <port>
#define GOHI(port, pn) port |= (1<<pn)

// write digital "low" to pin <pn> on port <port>
#define GOLO(port, pn) port &= ~(1<<pn)

#define TOGGLE(port, pn) port ^= (1<<pn)

#define READ(in, pn) (in & (1<<pn)) == (1<<pn)

void setupPins();

#endif
