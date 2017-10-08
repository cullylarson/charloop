const blessed = require('blessed')
const rpio = require('rpio')

rpio.init({
    gpiomem: true, /* Use /dev/gpiomem */
    mapping: 'physical', /* Use the P1-P40 numbering scheme */
})

const rotary = setupRotaryEncoder(rpio, {
    right: 11,
    left: 13,
    push: 15,
})

const program = blessed()
program.alternateBuffer()
program.hideCursor()

screen = blessed.screen()

list = blessed.list({
    parent: screen,
    width: '100%',
    height: '100%',
    top: 'center',
    left: 'center',
    align: 'center',
    border: {
        type: 'line'
    },
    style: {
        item: {
            fg: 'blue',
        },
        selected: {
            fg: 'white',
            bg: 'green',
        },
    },
})

list.setItems([
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
])

list.select(0)

rotary.on('left', () => {
    list.up(1)
    screen.render()
})
rotary.on('right', () => {
    list.down(1)
    screen.render()
})

screen.render()

function setupRotaryEncoder(rpio, pins) {
    const bus = (() => {
        const cbs = {}

        return {
            on: (label, cb) => {
                cbs[label] = cb
            },
            trigger: (label) => {
                // no callback, don't do anything
                if(!cbs.hasOwnProperty(label)) return

                cbs[label]()
            },
        }
    })()

    function pushed(pin) {
        if(pin === pins.push) bus.trigger('push')
    }

    const changed = (() => {
        let state

        const resetState = () => {
            state = {
                triggered: false,
                registered: false,
            }
        }

        const triggerState = () => {
            state = {
                triggered: true,
                registered: false,
            }
        }

        const registerState = () => {
            state = {
                triggered: true,
                registered: true,
            }
        }

        resetState()

        return function(pin) {
            const l = rpio.read(pins.left)
            const r = rpio.read(pins.right)

            // if both are high, then this is the initial state
            if(l && r) {
                resetState()
                return
            }
            // both low means the next state will tell us which direction we're going
            else if(!l && !r) {
                // unknown state
                if(!state.triggered) {
                    resetState()
                    return
                }
                // registered : ready for direction state
                else {
                    registerState()
                    return
                }
            }
            else if(!state.triggered) {
                triggerState()
                return
            }
            else {
                // unknown state
                if(!state.registered) {
                    resetState()
                    return
                }
                // pins tell us direction
                else {
                    if(r && !l) bus.trigger('left')
                    else if(!r && l) bus.trigger('right')

                    resetState()
                    return
                }
            }
        }
    })()

    rpio.open(pins.right, rpio.INPUT, rpio.PULL_UP)
    rpio.open(pins.left, rpio.INPUT, rpio.PULL_UP)
    rpio.open(pins.push, rpio.INPUT, rpio.PULL_UP)

    rpio.poll(pins.push, pushed, rpio.POLL_UP)

    rpio.poll(pins.right, changed, rpio.POLL_BOTH)
    rpio.poll(pins.left, changed, rpio.POLL_BOTH)

    return bus
}
