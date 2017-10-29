const {List, Item} = require('../list')
const {StandardBList} = require('../menu')

function create(go, screen, bus, data) {
    const bList = StandardBList(screen, {label: 'new song'})

    const list = List(bList)

    list.addAll([
        Item('Back', {
            onEnter: () => {
                go('/', {})
            }
        }),
    ])

    bus.on('nav-up', () => {
        list.move(-1)
        screen.render()
    })

    bus.on('nav-down', () => {
        list.move(1)
        screen.render()
    })

    bus.on('nav-enter', () => list.getSelected().data.onEnter())

    screen.render()
}

function list(go, screen, bus, data) {
    const bList = StandardBList(screen, {label: 'your songs'})

    const list = List(bList)

    list.addAll([
        Item('Back', {
            onEnter: () => {
                go('/', {})
            }
        }),
    ])

    bus.on('nav-up', () => {
        list.move(-1)
        screen.render()
    })

    bus.on('nav-down', () => {
        list.move(1)
        screen.render()
    })

    bus.on('nav-enter', () => list.getSelected().data.onEnter())

    screen.render()
}

module.exports = {
    create,
    list,
}
