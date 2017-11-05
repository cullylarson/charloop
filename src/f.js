const {
    curry,
} = require('ramda')

const log = curry((msg, x) => {
    console.log(msg, x)
    return x
})

module.exports = {
    log,
}
