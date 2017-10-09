const RotaryEncoder = require('./rotary-encoder')
const rpio = require('rpio')

rpio.init({
    gpiomem: true, /* Use /dev/gpiomem */
    mapping: 'physical', /* Use the P1-P40 numbering scheme */
})

const rotaryMain = RotaryEncoder(rpio, {
    right: 11,
    left: 13,
    push: 15,
})

rotaryMain.on('push', () => console.log('push'))
rotaryMain.on('left', () => console.log('left'))
rotaryMain.on('right', () => console.log('right'))
