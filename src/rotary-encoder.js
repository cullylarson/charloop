const Bus = require('./bus')

module.exports = function(rpio, pins) {
    const bus = Bus()

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
            }
            // both low means the next state will tell us which direction we're going
            else if(!l && !r) {
                // unknown state
                if(!state.triggered) {
                    resetState()
                }
                // registered : ready for direction state
                else {
                    registerState()
                }
            }
            else if(!state.triggered) {
                triggerState()
            }
            else {
                // unknown state
                if(!state.registered) {
                    resetState()
                }
                // pins tell us direction
                else {
                    if(r && !l) bus.trigger('left')
                    else if(!r && l) bus.trigger('right')

                    resetState()
                }
            }
        }
    })()

    rpio.open(pins.right, rpio.INPUT, rpio.PULL_UP)
    rpio.open(pins.left, rpio.INPUT, rpio.PULL_UP)
    rpio.open(pins.push, rpio.INPUT, rpio.PULL_UP)

    rpio.poll(pins.push, pushed, rpio.POLL_DOWN)

    rpio.poll(pins.right, changed, rpio.POLL_BOTH)
    rpio.poll(pins.left, changed, rpio.POLL_BOTH)

    return bus
}
