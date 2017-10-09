const blessed = require('blessed')
const Bus = require('./bus')

const colors = {
    HotPink2: [215, 95, 175],
}

module.exports = function() {
    const bus = Bus()

    const program = blessed()
    program.alternateBuffer()
    program.hideCursor()

    const screen = blessed.screen({
    })

    const list = blessed.list({
        parent: screen,
        width: '100%',
        height: '100%',
        top: 'center',
        left: 'center',
        align: 'center',
        border: {
            type: 'line',
        },
        style: {
            item: {
                fg: 'white',
            },
            selected: {
                fg: 'white',
                bg: colors.HotPink2,
            },
        },
    })

    list.setItems([
        'one',
        'two',
        'three',
        'four',
        'five',
        'six',
        'seven',
        'eight',
        'nine',
        'ten',
    ])

    screen.on('keypress', (str, key) => {
        if(key.ctrl && key.name === 'c') bus.trigger('exit')
        else if(key.name === 'up') bus.trigger('up')
        else if(key.name === 'k') bus.trigger('up')
        else if(key.name === 'down') bus.trigger('down')
        else if(key.name === 'j') bus.trigger('down')
        else if(key.name === 'enter') bus.trigger('enter')
        else if(key.name === 'l') bus.trigger('enter')
    })

    list.select(0)

    bus.on('up', () => {
        list.up(1)
        screen.render()
    })

    bus.on('down', () => {
        list.down(1)
        screen.render()
    })

    screen.render()

    return bus
}
