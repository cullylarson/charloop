const fs = require('fs')
const path = require('path')
const isPi = require('detect-rpi')
const RotaryEncoder = require('./rotary-encoder')
const Button = require('./button')
const Menu = require('./menu')
const Bus = require('./bus')
const Router = require('./router')
const SongRepository = require('./song/song-repository')
// const {record} = require('./audio')
const homeController = require('./home/home-controller')
const songController = require('./song/song-controller')

// params

if(!process.argv[2]) {
    console.log('ERROR: You must provide the path to the songs folder.')
    process.exit(1)
}

const songsFolder = path.resolve(process.argv[2])

if(!songsFolder) {
    console.log(`ERROR: Songs folder does not exist (${songsFolder}).`)
    process.exit(1)
}

try {
    fs.accessSync(songsFolder, fs.W_OK)
}
catch(e) {
    console.log(`ERROR: Song folder is not writable (${songsFolder}).`)
    process.exit(1)
}

// i/o and controls

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
        right: 29,
        left: 27,
        push: 31,
    })
    : Bus()

const songRepository = SongRepository(songsFolder)

const bus = Bus()

rotaryMain.on('left', () => bus.trigger('nav-up'))
rotaryMain.on('right', () => bus.trigger('nav-down'))
rotaryMain.on('push', () => bus.trigger('nav-enter'))

bus.on('exit', () => process.exit())

// routes

const router = Router(bus)

router.add('/', homeController.index)
router.add('/song/create', songController.create(songRepository))
router.add('/song/list', songController.list(songRepository))
router.add('/song/view', songController.view(songRepository))

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

rotaryVolume.on('push', () => console.log('volume push'))
rotaryVolume.on('left', () => console.log('volume left'))
rotaryVolume.on('right', () => console.log('volume right'))
buttonGreen.on('push', () => console.log('green push'))
buttonRed.on('push', () => console.log('red push'))
buttonBlackTop.on('push', () => console.log('black top push'))
buttonBlackButton.on('push', () => console.log('black bottom push'))

menu.on('exit', () => process.exit())
*/
