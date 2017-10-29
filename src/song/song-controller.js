const {List, Item} = require('../list')
const {StandardBList} = require('../menu')

function create(go, screen, nav, data) {
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
}

function list(go, screen, nav, data) {
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
}

module.exports = {
    create,
    list,
}
