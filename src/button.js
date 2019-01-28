const Bus = require('./bus')

module.exports = function(rpio, pushPin) {
    const bus = Bus()

    function pushed(pin) {
        if(pin !== pushPin) return

        // wait a bit to make sure we aren't bouncing
        rpio.msleep(20)
        if(rpio.read(pin)) return

        bus.trigger('push')
    }

    rpio.open(pushPin, rpio.INPUT, rpio.PULL_UP)

    rpio.poll(pushPin, pushed, rpio.POLL_DOWN)

    return bus
}
