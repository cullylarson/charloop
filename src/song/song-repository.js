const path = require('path')
const fs = require('fs')
const randomWords = require('random-words')
const {promisify} = require('util')
const Track = require('./track-entity')
const Song = require('./song-entity')
const {
    compose,
    map,
    filter,
    endsWith,
    split,
    replace,
    sort,
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

    function create() {
        const createdStamp = Date.now()
        const modifiedStamp = createdStamp

        return generateNewId()
            .then(id => {
                const songPath = path.join(songsDir, `${id}_${createdStamp}-${modifiedStamp}`)

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
        const id = randomWords({exactly: 4, join: '-'})
        return idExists(id)
            .then(exists => exists
                // recursively calls until it gets an id
                ? generateNewId()
                : Promise.resolve(id)
            )
    }

    function getAll() {
        function getTracks(songPath) {
            return promisify(fs.readdir)(songPath)
                .then(compose(
                    sort(prop('num')),
                    map(x => Track(
                        x[1],
                        parseInt(x[0]),
                        idToTitle(x[1]),
                        songPath
                    )),
                    map(split('_')), // the track number comes before the _
                    map(replace(/\.wav$/, '')),
                    filter(endsWith('.wav'))
                ))
                .catch(_ => Promise.reject(Error('Could not read track list.')))
        }

        return promisify(fs.readdir)(songsDir)
            .then(map(songFolderName => {
                const songFolder = path.join(songsDir, songFolderName)

                return compose(
                    x => {
                        const id = x[0]
                        const stamps = x[1].split('-')

                        return {
                            id,
                            folder: songFolder,
                            createdStamp: stamps[0],
                            modifiedStamp: stamps[1],
                        }
                    },
                    split('_')
                )(songFolderName)
            }))
            .then(map(x => {
                return getTracks(x.folder)
                    .then(tracks => Song(
                        x.id,
                        idToTitle(x.id),
                        x.folder,
                        tracks,
                        x.createdStamp,
                        x.modifiedStamp
                    ))
                    .catch(_ => Promise.reject(Error('Could not get song.')))
            }))
            .then(xs => Promise.all(xs))
            .then(sort(descend(prop('modifiedStamp')))) // show last modified songs first
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
    }
}
