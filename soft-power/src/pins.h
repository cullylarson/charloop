#include <avr/io.h>

#ifndef PINS_H
#define PINS_H

// the main on/off indicator switch
#define ONOFF           PA0
#define ONOFF_PORT      PORTA
#define ONOFF_DDR       DDRA
#define ONOFF_IN        PINA

// booted status of raspi (i.e. whether it's fully booted). high means booted, low means not booted or not running
#define RBOOTED         PA1
#define RBOOTED_PORT    PORTA
#define RBOOTED_DDR     DDRA
#define RBOOTED_IN      PINA

// stopped status of raspi (i.e. whether it's stopped/shutdown). hight means on, low means off/shutdown/stopped
#define RSTOPPED        PB2
#define RSTOPPED_PORT   PORTB
#define RSTOPPED_DDR    DDRB
#define RSTOPPED_IN     PINB

// power the device (i.e. via relay or mosfet)
#define PWR             PA2
#define PWR_PORT        PORTA
#define PWR_DDR         DDRA
#define PWR_IN          PINA

// tell the raspi to shut down
#define SHUTDOWN        PA3
#define SHUTDOWN_PORT   PORTA
#define SHUTDOWN_DDR    DDRA
#define SHUTDOWN_IN     PINA

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

// write digital "high" to pin <pn> on port <port>
#define GOHI(port, pn) port |= (1<<pn)

// write digital "low" to pin <pn> on port <port>
#define GOLO(port, pn) port &= ~(1<<pn)

#define TOGGLE(port, pn) port ^= (1<<pn)

// if that bit is 0, the switch is being pressed. if it's 1, not being pressed
#define READ(in, pn) (in & (1<<pn)) == 0

void setupPins();

#endif
