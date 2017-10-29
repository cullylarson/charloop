const {List, Item} = require('../list')
const {StandardBList} = require('../menu')

const create = (songRepository) => (go, screen, bus, data) => {
    songRepository.create()
        .then(song => go('/song/view', {id: song.id}))
        .catch(_ => go('/', {error: "Couldn't create that song!"}))
}

const view = (songRepository) => (go, screen, bus, data) => {
    if(!data.id) go('/song/list', {error: "Couldn't find that song!"})
    songRepository.get(data.id)
        .then(song => {
            const bList = StandardBList(screen, {label: song.title})

            const list = List(bList)

            list.addAll([
                Item('Back', {
                    onEnter: () => {
                        go('/', {})
                    },
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
        })
        .catch(_ => go('/song/list', {error: "Couldn't open that song!"}))
}

const list = (songRepository) => (go, screen, bus, data) => {
    const bList = StandardBList(screen, {label: 'your songs'})

    const list = List(bList)

    list.addAll([
        Item('Back', {
            onEnter: () => {
                go('/', {})
            },
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
    view,
}
