const mic = require('mic')
// const {pull} = require('pull-stream')
// const Speaker = require('audio-speaker')
const Speaker = require('speaker')
const {Readable} = require('stream')
const fs = require('fs')

const micInstance = mic({
    rate: 16000,
    bitwidth: 16,
    device: 'plughw:1', // this is ignored on mac, so no need to test if on laptop
    channels: '1',
    endian: 'little',
    encoding: 'signed-integer',
})

const input = micInstance.getAudioStream()
const stream = fs.createWriteStream('myFile.raw', {flags: 'w'})

const allVals = []
input.on('data', data => {
    const vals = []
    for(let i = 0; i < data.length; i += 2) {
        const val = data.readInt16LE(i)
        vals.push(val)
        allVals.push(val)
    }

    const output = Buffer.alloc(8192)
    vals.forEach((x, i) => {
        const bufferI = i * 2
        output.writeInt16LE(x, bufferI)
    })

    stream.write(output, () => {
        console.log('done writing')
    })
})

input.on('error', err => {
    console.log('Error in Input Stream: ' + err)
})

micInstance.start()

setTimeout(() => {
    console.log('stopping')
    micInstance.stop()

    const speaker = new Speaker({
        channels: 1,
        bitDepth: 16,
        sampleRate: 16000,
        signed: true,
    })

    const samples = new Readable()
    samples._read = () => {
        const buffer = Buffer.alloc(allVals.length * 2)
        for(let i = 0; i < allVals.length; i++) {
            const bufferI = i * 2
            buffer.writeInt16LE(allVals[i], bufferI)
        }

        samples.push(buffer)
    }
    samples.pipe(speaker)
}, 3000)

/*
setTimeout(() => {
    console.log('pausing')
    micInstance.pause()

    setTimeout(() => {
        console.log('resuming')
        micInstance.resume()
    }, 1000)
}, 3000)
*/
