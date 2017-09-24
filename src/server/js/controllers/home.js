import front from 'server/layout/front'

export default {
    index(req, res) {
        res.send(front('server'))
    },
}
