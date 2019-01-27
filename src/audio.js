const config = require('./config')
const mic = require('mic')

function Recorder() {
    const micInstance = mic({
        rate: config.sampleRate,
        bitwidth: 16,
        device: 'plughw:1', // this is ignored on mac, so no need to test if on laptop
        channels: '1',
        endian: 'little',
        encoding: 'signed-integer',
    })

    const input = micInstance.getAudioStream()

    input.on('data', data => {
        for(i = 0; i < data.length; i++)
        console.log(data.length, data[i])
    })

    input.on('error', err => {
        console.log('Error in Input Stream: ' + err)
    })

    micInstance.start()

    return {
        stop: () => {
            input.stop()
        },
    }

    /*
    if(isPi()) {
        // need buffer-size,time to be small so that the recording stop exactly when we kill the process
        const child = spawn('arecord', ['-D', 'plughw:1', '--format=S16_LE', '--rate=44100', '--buffer-time=10', '--buffer-size=10', filepath])

        return {
            stop: () => {
                child.stdin.pause()
                child.kill()
            },
        }
    }
    else {
        console.log('start recording: ' + filepath)
        return {
            stop: () => {
                console.log('stop recording' + filepath)
            },
        }
    }
    */
}

module.exports = {
    Recorder,
}
