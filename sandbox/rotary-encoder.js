const rpio = require('rpio')

const pins = {
    right: 11,
    left: 13,
    push: 15,
}

let inLoop = false

rpio.init({
    gpiomem: true, /* Use /dev/gpiomem */
    mapping: 'physical', /* Use the P1-P40 numbering scheme */
})

function pushed(pin) {
    if(pin === pins.push) console.log("push")
    else console.log("unknown pin push")
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
                if(r && !l) console.log('ccw / left')
                else if(!r && l) console.log('cw  / right')

                resetState()
                return
            }
        }
    }
})()

/*
function changed(pin) {
    disablePolling()
    if(inLoop) return
    inLoop = true

    let record = []
    let currentL = null
    let currentR = null
    let lastL = null
    let lastR = null
    let sameCount = 0

    while(true) {
        currentL = rpio.read(pins.left)
        currentR = rpio.read(pins.right)

        if(currentL === lastL && currentR === lastR) sameCount++
        if(sameCount > 1000) break;

        record.push({left: currentL, right: currentR})
        lastL = currentL
        lastR = currentR
        rpio.msleep(1)
    }

    printRecord(record)
    inLoop = false
    enablePolling()
}

function disablePolling() {
    rpio.poll(pins.right, null);
    rpio.poll(pins.left, null);
}

function enablePolling() {
    rpio.poll(pins.right, changed, rpio.POLL_BOTH);
    rpio.poll(pins.left, changed, rpio.POLL_BOTH);
}

function printRecord(record) {
    let lefts = ""
    let rights = ""
    let lastLeft = null
    let lastRight = null

    for(let i = 0; i < record.length; i++) {
        if(record[i].left !== lastLeft || record[i].right !== lastRight) {
            lefts += record[i].left ? '-' : '_'
            rights += record[i].right ? '-' : '_'
        }

        lastLeft = record[i].left
        lastRight = record[i].right
    }

    console.log("L / " + lefts)
    console.log("R / " + rights)
    console.log('--------------')
}
*/

rpio.open(pins.right, rpio.INPUT, rpio.PULL_UP);
rpio.open(pins.left, rpio.INPUT, rpio.PULL_UP);
rpio.open(pins.push, rpio.INPUT, rpio.PULL_UP);

rpio.poll(pins.push, pushed, rpio.POLL_UP);

rpio.poll(pins.right, changed, rpio.POLL_BOTH);
rpio.poll(pins.left, changed, rpio.POLL_BOTH);
