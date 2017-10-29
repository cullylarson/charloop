const {List, Item} = require('../list')
const {StandardBList} = require('../menu')

function index(go, screen, bus, data) {
    const bList = StandardBList(screen, {label: 'charloop'})

    const list = List(bList)

    list.addAll([
        Item('New Song', {
            onEnter: () => {
                go('/song/create', {})
            },
        }),
        Item('Your Songs', {
            onEnter: () => {
                go('/song/list', {})
            },
        }),
    ])

    bus.on('nav-up', () => {
        list.up()
        screen.render()
    })

    bus.on('nav-down', () => {
        list.down()
        screen.render()
    })

    bus.on('nav-enter', () => list.getSelected().data.onEnter())

    screen.render()
}

module.exports = {
    index,
}
