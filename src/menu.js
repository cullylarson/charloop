const blessed = require('blessed')

const colors = {
    HotPink2: [215, 95, 175],
}

module.exports = function(trackList) {
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

    list.setItems([])

    trackList.bus.on('add', ({idx, track}) => {
        list.insertItem(idx, track.name)
        screen.render()
    })

    trackList.bus.on('remove', ({idx}) => {
        list.spliceItem(idx, 1)
        screen.render()
    })

    trackList.bus.on('select', ({idx}) => {
        list.select(idx)
        screen.render()
    })

    screen.render()

    return screen
}
