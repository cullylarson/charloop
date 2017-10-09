module.exports = function() {
    const cbs = {}

    return {
        on: (label, cb) => {
            if(cbs.hasOwnProperty(label)) cbs[label].push(cb)
            else cbs[label] = [cb]
        },

        trigger: (label, e) => {
            if(cbs.hasOwnProperty(label)) cbs[label].forEach(f => f(e))
        },
    }
}
