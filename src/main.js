const readline = require('readline')
const isPi = require('detect-rpi')
const RotaryEncoder = require('./rotary-encoder')
const Menu = require('./menu')
const Bus = require('./bus')

readline.emitKeypressEvents(process.stdin)
process.stdin.setRawMode(true)

const rpio = isPi()
    ? require('rpio')
    : null

if(isPi()) {
    rpio.init({
        gpiomem: true, /* Use /dev/gpiomem */
        mapping: 'physical', /* Use the P1-P40 numbering scheme */
    })
}

const rotaryMain = isPi()
    ? RotaryEncoder(rpio, {
        right: 11,
        left: 13,
        push: 15,
    })
    : Bus()

const menu = Menu()

rotaryMain.on('left', () => menu.trigger('up'))
rotaryMain.on('right', () => menu.trigger('down'))
