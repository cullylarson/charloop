const {
    curry,
} = require('ramda')

const log = curry((msg, x) => {
    console.log(msg, x)
    return x
})

const maxList = xs => {
    let first = true
    let max

    xs.forEach(x => {
        if(first || x > max) {
            max = x
            first = false
        }
    })

    return max
}

module.exports = {
    log,
    maxList,
}
