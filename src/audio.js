const {spawn} = require('child_process')
const isPi = require('detect-rpi')

function record(filepath) {
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
}

module.exports = {
    record,
}
