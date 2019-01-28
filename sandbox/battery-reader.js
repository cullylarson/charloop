const blessed = require('blessed')
const rpio = require('rpio')
const Bus = require('../src/bus')

function PacketBuffer(packetSize) {
    let buffer = ''

    return {
        clear() {
            buffer = ''
        },

        push(bit) {
            buffer += bit ? '1' : '0'
            // buffer is beyond the determined size, get rid of oldest bit (the first one)
            if(buffer.length > packetSize) {
                buffer = buffer.substring(1)
            }
        },

        count() {
            return buffer.length
        },

        get() {
            return buffer
        },

        isPreamble() {
            return buffer === '11000000000011'
        },

        // should only get if buffer is full, otherwise it will be meaningless
        getInt() {
            const dataStr = buffer.substring(2, 12) // get rid of the 11's at the beginning and end of the packet
            return parseInt(dataStr, 2)
        },

        isFull() {
            return buffer.length >= packetSize
        },
    }
}

// reads two data packets and triggers an event with both packets
function BatteryReader(rpio, clockPin, dataPin) {
    const bus = Bus()
    let packetBuffer = PacketBuffer(14)
    let expectingData = false
    let packets = []

    function clockTick(pin) {
        packetBuffer.push(rpio.read(pins.data))

        if(packetBuffer.isFull()) {
            if(packetBuffer.isPreamble()) {
                expectingData = true
                packetBuffer.clear()
            }
            else if(expectingData) {
                packets.push(packetBuffer.getInt())
                packetBuffer.clear()

                // got our two packets
                if(packets.length === 4) {
                    bus.trigger('data', packets.slice()) // shallow copy
                    expectingData = false
                    packets = []
                }
            }
        }
    }

    rpio.open(clockPin, rpio.INPUT, rpio.PULL_DOWN)
    rpio.open(dataPin, rpio.INPUT, rpio.PULL_DOWN)

    rpio.poll(clockPin, clockTick)

    return bus
}

function dec2bin(dec) {
    return (dec >>> 0).toString(2)
}

const pins = {
    clock: 11,
    data: 10,
    rbooted: 12,
    rstopped: 8,
    shutdown: 13,
}

rpio.init({
    gpiomem: true, /* Use /dev/gpiomem */
    mapping: 'physical', /* Use the P1-P40 numbering scheme */
})

rpio.open(pins.rbooted, rpio.OUTPUT, rpio.LOW)
// rpio.open(pins.rstopped, rpio.OUTPUT, rpio.HIGH)

const screen = blessed.screen({})

screen.on('keypress', (str, key) => {
    if(key.shift && key.name === 'b') rpio.write(pins.rbooted, rpio.LOW)
    else if(key.name === 'b') rpio.write(pins.rbooted, rpio.HIGH)
    else if(key.ctrl && key.name === 'c') process.exit(0)
    else if(key.name === 's') console.log(rpio.read(pins.shutdown) ? 'yes, shutdown' : 'no, dont shutdown')
})

const batteryReader = BatteryReader(rpio, pins.clock, pins.data)

batteryReader.on('data', ([voltage, percent, stateReport, ioReport]) => {
    // const maxValue = 1024
    // console.log(dec2bin(data) + ' (' + Math.floor(data / 1024 * 100) + '%)')
    // percent will be 1 - 101, will need to subtract 1 to get 0 - 100
    const realPercent = percent - 1
    console.log((new Date()).getTime())
    console.log('voltage: ', dec2bin(voltage) + ' (' + voltage + ')')
    console.log('percent: ', realPercent)
    console.log('state: ', dec2bin(stateReport))
    console.log('io: ', dec2bin(ioReport))
    console.log('--------')
})
