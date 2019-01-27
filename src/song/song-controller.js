const {List, Item} = require('../list')
const {StandardBList} = require('../menu')
const {Recorder} = require('../audio')
const {
    prop,
    forEach,
} = require('ramda')

const create = (songRepository) => (go, screen, bus, data) => {
    const bpm = parseInt(prop('bpm', data))

    if(bpm) {
        songRepository.create(bpm)
            .then(song => go('/song/view', {id: song.id}))
            .catch(_ => go('/', {error: "Couldn't create that song!"}))
    }
    else {
        const bList = StandardBList(screen, {label: 'your songs'})

        const list = List(bList)
        let bpm = 80

        const bpmToTitle = (bpm) => `Beats per minute: ${bpm}`

        list.addAll([
            Item('Back', {
                onEnter: () => {
                    go('/', {})
                },
            }),
            Item(bpmToTitle(bpm), {
                isEngageable: true,
                onUp: () => {
                    if(bpm >= 200) return
                    bpm++
                    list.setSelectedTitle(bpmToTitle(bpm))
                },
                onDown: () => {
                    if(bpm <= 20) return
                    bpm--
                    list.setSelectedTitle(bpmToTitle(bpm))
                },
            }),
            Item('Start', {
                onEnter: () => {
                    go('/song/create', {bpm})
                },
            }),
        ])

        screen.render()

        ;(() => {
            let isEngaged = false

            bus.on('nav-enter', () => {
                const selected = list.getSelected()

                if(selected.data.isEngageable) {
                    isEngaged = !isEngaged

                    if(isEngaged) list.engage()
                    else list.disengage()

                    screen.render()
                }

                selected.data.onEnter && selected.data.onEnter()
            })

            bus.on('nav-up', () => {
                if(isEngaged) {
                    const selected = list.getSelected()
                    selected.data.onUp && selected.data.onUp()
                }
                else {
                    list.up()
                }

                screen.render()
            })

            bus.on('nav-down', () => {
                if(isEngaged) {
                    const selected = list.getSelected()
                    selected.data.onDown && selected.data.onDown()
                }
                else {
                    list.down()
                }

                screen.render()
            })
        })()
    }
}

const view = (songRepository) => (go, screen, bus, data) => {
    if(!data.id) go('/song/list', {error: "Couldn't find that song!"})
    const recorder = data.recorder || null
    const recordingTrack = data.recordingTrack || null
    if(recorder && !recordingTrack) go('/song/view', {id: data.id, error: 'Started recording without a track. Not sure how that happened. Try again.'})

    songRepository.get(data.id)
        .then(song => {
            return songRepository.getTracks(song)
                .then(tracks => ({song, tracks}))
        })
        .then(info => {
            const bList = StandardBList(screen, {label: info.song.title})

            const list = List(bList)

            list.add(Item('Back', {
                onEnter: () => {
                    go('/song/list', {})
                },
            }))

            info.tracks.forEach(x => list.add(Item(x.titleWithNum)))

            bus.on('nav-up', () => {
                list.up()
                screen.render()
            })

            bus.on('nav-down', () => {
                list.down()
                screen.render()
            })

            bus.on('start-recording', () => {
                // already recording
                if(recorder) return

                songRepository.addNextTrack(info.song, info.tracks)
                    .then(nextTrack => {
                        go('/song/view', {
                            id: data.id,
                            recorder: Recorder(), // (nextTrack.filePath),
                            recordingTrack: nextTrack,
                        })
                    })
                    .catch(_ => go('/song/view', {id: data.id, error: "Coudn't start recording for some reason. Try again."}))
            })

            bus.on('stop-recording', () => {
                // not recording
                if(!recorder) return

                recorder.stop()
                go('/song/view', {id: data.id})
            })

            bus.on('nav-enter', () => list.getSelected().data.onEnter && list.getSelected().data.onEnter())

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

    songRepository.getAll()
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
