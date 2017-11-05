const {List, Item} = require('../list')
const {StandardBList} = require('../menu')
const {
    forEach,
} = require('ramda')

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

            bus.on('nav-enter', () => list.getSelected().data.onEnter && list.getSelected().data.onEnter())

            screen.render()
        })
        .catch(_ => go('/song/list', {error: "Couldn't open that song!"}))
}

const list = (songRepository) => (go, screen, bus, data) => {
    const bList = StandardBList(screen, {label: 'your songs'})

    const list = List(bList)
    const songs = songRepository.getAll()

    list.addAll([
        Item('Back', {
            onEnter: () => {
                go('/', {})
            },
        }),
    ])

    songs
        .then(forEach(x => list.add(Item(x.title, {
            onEnter: () => {
                go('/song/view', {id: x.id})
            },
        }))))
        .then(_ => screen.render())

    bus.on('nav-up', () => {
        list.up()
        screen.render()
    })

    bus.on('nav-down', () => {
        list.down()
        screen.render()
    })

    bus.on('nav-enter', () => list.getSelected().data.onEnter && list.getSelected().data.onEnter())
}

module.exports = {
    create,
    list,
    view,
}
