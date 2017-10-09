const rpio = require('rpio')
const RotaryEncoder = require('./rotary-encoder')
const Menu = require('./menu')

rpio.init({
    gpiomem: true, /* Use /dev/gpiomem */
    mapping: 'physical', /* Use the P1-P40 numbering scheme */
})

const rotaryMain = RotaryEncoder(rpio, {
    right: 11,
    left: 13,
    push: 15,
})

const menu = Menu()

rotaryMain.on('left', () => menu.trigger('up'))
rotaryMain.on('right', () => menu.trigger('down'))
