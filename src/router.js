const Bus = require('../src/bus')
const blessed = require('blessed')

module.exports = (navBus) => {
    const routes = {}

    const screen = blessed.screen({
    })

    screen.on('keypress', (str, key) => {
        if(key.ctrl && key.name === 'c') navBus.trigger('exit')
        else if(key.name === 'up') navBus.trigger('up')
        else if(key.name === 'k') navBus.trigger('up')
        else if(key.name === 'down') navBus.trigger('down')
        else if(key.name === 'j') navBus.trigger('down')
        else if(key.name === 'enter') navBus.trigger('enter')
        else if(key.name === 'l') navBus.trigger('enter')
    })

    const router = {
        add: (label, cb) => routes[label] = cb,
        go: (label, data) => {
            // clear the screen
            screen.children.forEach(screen.remove)

            // create a bus that can be disposed of, without filling up the nav bus with callbacks to old, dead routes
            const routerBus = Bus()
            const onAllNavEvents = (label, e) => routerBus.trigger(label, e)
            navBus.onAll(onAllNavEvents)

            // this is here just so that we don't fill up the call stack with route calls (I think)
            const routeGo = (routeLabel, data) => setTimeout(() => {
                // unregister our event handler
                navBus.offAll(onAllNavEvents)

                router.go(routeLabel, data)
            }, 0)

            routes[label](routeGo, screen, routerBus, data)
        }
    }

    return router
}
