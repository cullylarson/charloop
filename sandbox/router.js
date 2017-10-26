const Bus = require('../src/bus')
const blessed = require('blessed')

const colors = {
    HotPink2: [215, 95, 175],
}

const Router = (navBus) => {
    const routes = {}

    const screen = blessed.screen({
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

const navBus = Bus()

setTimeout(() => navBus.trigger('blah'), 1000)
setTimeout(() => navBus.trigger('blah'), 4000)

const router = Router(navBus)

router.add('/', (go, screen, nav, data) => {
    const list = blessed.list({
        parent: screen,
        width: '100%',
        height: '100%',
        top: 'center',
        left: 'center',
        align: 'center',
        border: {
            type: 'line',
        },
        style: {
            item: {
                fg: 'white',
            },
            selected: {
                fg: 'white',
                bg: colors.HotPink2,
            },
        },
    })

    list.setItems([
        'l1-a',
        'l1-b',
    ])

    nav.on('blah', () => console.log('home blah'))

    screen.render()

    setTimeout(() => go('/blah', {}), 2000)
})

router.add('/blah', (go, screen, nav, data) => {
    const list = blessed.list({
        parent: screen,
        width: '100%',
        height: '100%',
        top: 'center',
        left: 'center',
        align: 'center',
        border: {
            type: 'line',
        },
        style: {
            item: {
                fg: 'white',
            },
            selected: {
                fg: 'white',
                bg: colors.HotPink2,
            },
        },
    })

    list.setItems([
        'l2-a',
        'l2-b',
    ])

    nav.on('blah', () => console.log('blah blah'))

    screen.render()
})

router.go('/', {})
