const path = require('path')
const isPi = require('detect-rpi')
const RotaryEncoder = require('./rotary-encoder')
const Bus = require('./bus')
const Router = require('./router')
const {record} = require('./audio')
const homeController = require('./home/home-controller')
const songController = require('./song/song-controller')

const rpio = isPi()
    ? require('rpio')
    : null

if(rpio) {
    rpio.init({
        gpiomem: true, /* Use /dev/gpiomem */
        mapping: 'physical', /* Use the P1-P40 numbering scheme */
    })
}

const rotaryMain = rpio
    ? RotaryEncoder(rpio, {
        right: 11,
        left: 13,
        push: 15,
    })
    : Bus()

const bus = Bus()

rotaryMain.on('left', () => bus.trigger('nav-up'))
rotaryMain.on('right', () => bus.trigger('nav-down'))
rotaryMain.on('push', () => bus.trigger('nav-enter'))

bus.on('exit', () => process.exit())

const router = Router(bus)

router.add('/', homeController.index)
router.add('/song/create', songController.create)
router.add('/song/list', songController.list)

router.go('/', {})

/*
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
*/
