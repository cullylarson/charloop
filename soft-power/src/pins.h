#include <avr/io.h>

#ifndef PINS_H
#define PINS_H

// the main on/off indicator switch
#define ONOFF           PB3
#define ONOFF_PORT      PORTB
#define ONOFF_DDR       DDRB
#define ONOFF_IN        PINB

// status of raspi (i.e. is it running or off). high means booted and running, low means not booted or not running
#define STATUS          PB0
#define STATUS_PORT     PORTB
#define STATUS_DDR      DDRB
#define STATUS_IN       PINB

// power the device (i.e. via relay or mosfet)
#define PWR             PB4
#define PWR_PORT        PORTB
#define PWR_DDR         DDRB
#define PWR_IN          PINB

// tell the raspi to shut down
#define SHUTDOWN        PB0
#define SHUTDOWN_PORT   PORTB
#define SHUTDOWN_DDR    DDRB
#define SHUTDOWN_IN     PINB

// an indicator LED
#define LED             PB1
#define LED_PORT        PORTB
#define LED_DDR         DDRB
#define LED_IN          PINB

// reset the raspi (tell it to turn off, of it's shut down)
#define RESET          PB2
#define RESET_PORT     PORTB
#define RESET_DDR      DDRB
#define RESET_IN       PINB

// write digital "high" to pin <pn> on port <port>
#define GOHI(port, pn) port |= (1<<pn)

// write digital "low" to pin <pn> on port <port>
#define GOLO(port, pn) port &= ~(1<<pn)

#define TOGGLE(port, pn) port ^= (1<<pn)

// if that bit is 1, the switch is being pressed. if it's 0, not being pressed
#define READ(port, pn) (port & (1<<pn)) == 1

void setupPins();

#endif
