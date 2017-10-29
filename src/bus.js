module.exports = function() {
    const cbs = {}
    const allCbs = []

    return {
        onAll: (cb) => {
            allCbs.push(cb)
        },

        offAll: (cb) => {
            const idx = allCbs.indexOf(cb)
            if(idx === -1) return

            // remove the callback
            allCbs.splice(idx, 1)
        },

        on: (label, cb) => {
            if(cbs.hasOwnProperty(label)) cbs[label].push(cb)
            else cbs[label] = [cb]
        },

        off: (label, cb) => {
            if(!cbs.hasOwnProperty(label)) return

            const idx = cbs[label].indexOf(cb)
            if(idx === -1) return

            // remove the callback
            cbs[label].splice(idx, 1)
        },

        trigger: (label, e) => {
            if(cbs.hasOwnProperty(label)) cbs[label].forEach(f => f(e))

            if(allCbs.length) allCbs.forEach(f => f(label, e))
        },
    }
}
