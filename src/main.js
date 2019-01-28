const path = require('path')
const isPi = require('detect-rpi')
const RotaryEncoder = require('./rotary-encoder')
const Button = require('./button')
const Menu = require('./menu')
const Bus = require('./bus')
const {record} = require('./audio')

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
        right: 29,
        left: 27,
        push: 31,
    })
    : Bus()

const rotaryVolume = isPi()
    ? RotaryEncoder(rpio, {
        right: 35,
        left: 33,
        push: 37,
    })
    : Bus()

const buttonRed = isPi()
    ? Button(rpio, 38)
    : Bus()

const buttonGreen = isPi()
    ? Button(rpio, 40)
    : Bus()

const buttonBlackTop = isPi()
    ? Button(rpio, 36)
    : Bus()

const buttonBlackButton = isPi()
    ? Button(rpio, 32)
    : Bus()

const menu = Menu()

rotaryMain.on('left', () => menu.trigger('up'))
rotaryMain.on('right', () => menu.trigger('down'))

let recording

rotaryMain.on('push', () => {
    if(recording) {
        console.log('stop recording') // stub
        recording.stop()
        recording = undefined
    }
    else {
        console.log('start recording') // stub
        recording = record(path.join(__dirname, '..', 'output', 'test.wav'))
    }
})

rotaryVolume.on('push', () => console.log('volume push'))
rotaryVolume.on('left', () => console.log('volume left'))
rotaryVolume.on('right', () => console.log('volume right'))
buttonGreen.on('push', () => console.log('green push'))
buttonRed.on('push', () => console.log('red push'))
buttonBlackTop.on('push', () => console.log('black top push'))
buttonBlackButton.on('push', () => console.log('black bottom push'))

menu.on('exit', () => process.exit())
