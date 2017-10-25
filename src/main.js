const path = require('path')
const isPi = require('detect-rpi')
const RotaryEncoder = require('./rotary-encoder')
const Menu = require('./menu')
const Bus = require('./bus')
const {TrackList, Track} = require('./tracks')
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
        right: 11,
        left: 13,
        push: 15,
    })
    : Bus()

const trackList = TrackList()
const screen = Menu(trackList)
trackList.addAll([
    Track('1', 'one.wav'),
    Track('2', 'two.wav'),
    Track('3', 'three.wav'),
])

screen.on('keypress', (str, key) => {
    if(key.ctrl && key.name === 'c') process.exit()
    else if(key.name === 'up') trackList.up()
    else if(key.name === 'k') trackList.up()
    else if(key.name === 'down') trackList.down()
    else if(key.name === 'j') trackList.down()
    else if(key.name === 'enter') trackList.add(Track('asdf', 'foo'))
    else if(key.name === 'l') trackList.add(Track('asdf', 'foo'))
})

rotaryMain.on('left', trackList.up)
rotaryMain.on('right', trackList.down)

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
