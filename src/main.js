const fs = require('fs')
const path = require('path')
const isPi = require('detect-rpi')
const RotaryEncoder = require('./rotary-encoder')
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
        right: 11,
        left: 13,
        push: 15,
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
*/
