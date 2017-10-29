const {List, Item} = require('../list')
const {StandardBList} = require('../menu')

function index(go, screen, nav, data) {
    const bList = StandardBList(screen, {label: 'charloop'})

    const list = List(bList)

    list.addAll([
        Item('New Song', {
            onEnter: () => {
                go('/song/create', {})
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
}

module.exports = {
    index,
}
