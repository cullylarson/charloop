const path = require('path')
const fs = require('fs')
const randomWords = require('random-words')
const {promisify} = require('util')
const Track = require('./track-entity')
const Song = require('./song-entity')
const {maxList} = require('../f')
const {
    compose,
    map,
    filter,
    endsWith,
    split,
    replace,
    sortBy,
    prop,
    descend,
    head,
} = require('ramda')

module.exports = function(songsDir) {
    // find out if an id already exists
    function idExists(id) {
        return get(id)
            .then(song => Promise.resolve(true))
            .catch(_ => Promise.resolve(false))
    }

    function create(bpm) {
        const createdStamp = Date.now()
        const modifiedStamp = createdStamp

        return generateNewSongId()
            .then(id => {
                const songPath = path.join(songsDir, `${id}_${bpm}_${createdStamp}-${modifiedStamp}`)

                return promisify(fs.mkdir)(songPath)
                    .then(_ => Promise.resolve({id, songPath}))
            })
            .then(({id, songPath}) => Song(
                id,
                idToTitle(id),
                songPath,
                []
            ))
            .catch(_ => Promise.reject(Error('Could not create song.')))
    }

    function idToTitle(id) {
        return id
            .split('-')
            .map(x => x.charAt(0).toUpperCase() + x.substring(1)) // capitalize the first letter of each word
            .join(' ')
    }

    /*
    const titleToId = compose(
        join('-'),
        map(toLower),
        filter(x => !!x),
        map(trim),
        split(' ')
    )
    */

    function generateNewSongId() {
        const id = randomWords({exactly: 4, join: '-'})
        return idExists(id)
            .then(exists => exists
                // recursively calls until it gets an id
                ? generateNewSongId()
                : Promise.resolve(id)
            )
    }

    function getTracks(song) {
        return promisify(fs.readdir)(song.folder)
            .then(compose(
                sortBy(prop('num')),
                map(filename => {
                    const {id, num} = compose(
                        x => ({id: x[1], num: parseInt(x[0])}),
                        split('_'), // the track number comes before the _
                        replace(/\.wav$/, '')
                    )(filename)

                    return Track(
                        id,
                        num,
                        idToTitle(id),
                        path.join(song.folder, filename)
                    )
                }),
                filter(endsWith('.wav'))
            ))
            .catch(_ => Promise.reject(Error('Could not read track list.')))
    }

    // params: the song and current list of tracks
    function generateNewTrackId(song, tracks) {
        const trackIdExists = id => {
            return compose(
                x => !!x.length,
                filter(x => x.id === id)
            )(tracks)
        }

        const id = randomWords({exactly: 2, join: '-'})
        return trackIdExists(id)
            // recursively calls until it gets an id
            ? generateNewSongId()
            : Promise.resolve(id)
    }

    // adds a new track, based on the current list of tracks. this track will be the 'next' track (i.e. its track number will come after the current one)
    function addNextTrack(song, tracks) {
        const maxTrackNum = compose(
            x => x || 0,
            maxList,
            map(prop('num'))
        )(tracks)

        const trackNum = maxTrackNum + 1

        return generateNewTrackId(song, tracks)
            .then(id => Track(
                id,
                trackNum,
                idToTitle(id),
                path.join(song.folder, `${trackNum}_${id}.wav`)
            ))
            .then(track => {
                return promisify(fs.open)(track.filePath, 'wx')
                    .then(promisify(fs.close))
                    .then(_ => Promise.resolve(track))
            })
            .catch(_ => Promise.reject(Error('Could create track.')))
    }

    function getAll() {
        return promisify(fs.readdir)(songsDir)
            .then(map(songFolderName => {
                const songFolder = path.join(songsDir, songFolderName)

                return compose(
                    x => {
                        const id = x[0]
                        const bpm = x[1]
                        const stamps = x[2].split('-')

                        return Song(
                            id,
                            idToTitle(id),
                            songFolder,
                            bpm,
                            stamps[0],
                            stamps[1]
                        )
                    },
                    split('_')
                )(songFolderName)
            }))
            .then(xs => Promise.all(xs))
            .then(sortBy(descend(prop('modifiedStamp')))) // show last modified songs first
            .catch(_ => Promise.reject(Error('Could not get songs.')))
    }

    function get(id) {
        return getAll()
            .then(filter(x => x.id === id))
            .then(x => !x.length
                ? Promise.reject(Error('Could not get song.'))
                : head(x)
            )
            .catch(_ => Promise.reject(Error('Could not get songs.')))
    }

    return {
        create,
        get,
        getAll,
        getTracks,
        addNextTrack,
    }
}
