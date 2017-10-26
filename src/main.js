const path = require('path')
const isPi = require('detect-rpi')
const RotaryEncoder = require('./rotary-encoder')
const {StandardBList} = require('./menu')
const Bus = require('./bus')
const Router = require('./router')
const {List, Item} = require('./list')
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

const navBus = Bus()

rotaryMain.on('left', () => navBus.trigger('up'))
rotaryMain.on('right', () => navBus.trigger('down'))
rotaryMain.on('push', () => navBus.trigger('enter'))

navBus.on('exit', () => process.exit())

const router = Router(navBus)

router.add('/', (go, screen, nav, data) => {
    const bList = StandardBList(screen, {label: 'charloop'})

    const list = List(bList)

    list.addAll([
        Item('New Song', {
            onEnter: () => {
                go('/song/new', {})
            }
        }),
        Item('Your Songs', {
            onEnter: () => {
                go('/song/list', {})
            }
        }),
    ])

    nav.on('up', () => {
        list.up()
        screen.render()
    })

    nav.on('down', () => {
        list.down()
        screen.render()
    })

    nav.on('enter', () => list.getSelected().data.onEnter())

    screen.render()
})

router.add('/song/new', (go, screen, nav, data) => {
    const bList = StandardBList(screen, {label: 'new song'})

    const list = List(bList)

    list.addAll([
        Item('Back', {
            onEnter: () => {
                go('/', {})
            }
        }),
    ])

    nav.on('up', () => {
        list.move(-1)
        screen.render()
    })

    nav.on('down', () => {
        list.move(1)
        screen.render()
    })

    nav.on('enter', () => list.getSelected().data.onEnter())

    screen.render()
})

router.add('/song/list', (go, screen, nav, data) => {
    const bList = StandardBList(screen, {label: 'your songs'})

    const list = List(bList)

    list.addAll([
        Item('Back', {
            onEnter: () => {
                go('/', {})
            }
        }),
    ])

    nav.on('up', () => {
        list.move(-1)
        screen.render()
    })

    nav.on('down', () => {
        list.move(1)
        screen.render()
    })

    nav.on('enter', () => list.getSelected().data.onEnter())

    screen.render()
})

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
