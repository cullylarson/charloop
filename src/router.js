const Bus = require('../src/bus')
const blessed = require('blessed')

module.exports = (bus) => {
    const routes = {}

    const screen = blessed.screen({
    })

    screen.on('keypress', (str, key) => {
        if(key.ctrl && key.name === 'c') bus.trigger('exit')
        else if(key.name === 'up') bus.trigger('nav-up')
        else if(key.name === 'k') bus.trigger('nav-up')
        else if(key.name === 'down') bus.trigger('nav-down')
        else if(key.name === 'j') bus.trigger('nav-down')
        else if(key.name === 'enter') bus.trigger('nav-enter')
        else if(key.name === 'l') bus.trigger('nav-enter')
    })

    const router = {
        add: (label, cb) => routes[label] = cb,
        go: (label, data) => {
            // clear the screen
            screen.children.forEach(screen.remove)

            // create a bus that can be disposed of, without filling up the nav bus with callbacks to old, dead routes
            const routerBus = Bus()
            const onAllNavEvents = (label, e) => routerBus.trigger(label, e)
            bus.onAll(onAllNavEvents)

            // this is here just so that we don't fill up the call stack with route calls (I think)
            const routeGo = (routeLabel, data) => setTimeout(() => {
                // unregister our event handler
                bus.offAll(onAllNavEvents)

                router.go(routeLabel, data)
            }, 0)

            routes[label](routeGo, screen, routerBus, data)
        }
    }

    return router
}
