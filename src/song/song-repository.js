const path = require('path')
const fs = require('fs')
const randomWords = require('random-words')
const {promisify} = require('util')
const Track = require('./track-entity')
const Song = require('./song-entity')
const {
    compose,
    map,
    trim,
    filter,
    endsWith,
    splitAt,
    replace,
    sortBy,
    prop,
} = require('ramda')

module.exports = function(songsDir) {
    const cache = {}

    // find out if an id already exists
    function idExists(id) {
        return get(id)
            .then(song => Promise.resolve(true))
            .catch(_ => Promise.resolve(false))
    }

    function create() {
        return generateNewId()
            .then(id => {
                const songPath = path.join(songsDir, id)

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

    function generateNewId() {
        function generateIdIfNotExists() {
            const id = randomWords({exactly: 4, join: '-'})
            return idExists(id)
                .then(exists => exists
                    ? Promise.resolve(null)
                    : Promise.resolve(id)
                )
        }

        // recursively calls until it gets an id
        return generateIdIfNotExists()
            .then(id => id || generateNewId())
    }

    function get(id) {
        if(cache[id]) return cache[id]

        function getTracks(songPath) {
            return promisify(fs.readdir)(songPath)
                .then(compose(
                    map(sortBy(prop('num'))),
                    map(x => Track(
                        x[1],
                        parseInt(x[0]),
                        idToTitle(x[1]),
                        songPath
                    )),
                    map(x => splitAt(x.indexOf('-'))), // everything before the first '-' is the track number
                    map(replace(/\.wav^/, '')),
                    filter(endsWith('.wav')),
                    map(trim)
                ))
                .catch(_ => Promise.reject(Error('Could not read track list.')))
        }

        const songPath = path.join(songsDir, id)

        return promisify(fs.access)(songsDir, fs.F_OK)
            .then(_ => getTracks(songPath))
            .then(tracks => Song(
                id,
                idToTitle(id),
                songPath,
                tracks
            ))
            .catch(_ => Promise.reject(Error('Could not get song.')))
    }

    return {
        create,
        get,
        idExists,
    }
}
