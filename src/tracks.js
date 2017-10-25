const Bus = require('./bus')

function Track(name, filePath) {
    return {
        name,
        filePath,
    }
}

function TrackList() {
    const list = []
    let selectedIdx = 0
    const bus = Bus()

    const manager = {
        bus,
        add: (track) => {
            const idx = list.length
            list.push(track)
            bus.trigger('add', {idx, track})
        },
        remove: (idx) => {
            list.splice(idx, 1)
            bus.trigger('remove', {idx})
        },
        up: () => {
            selectedIdx = selectedIdx === 0
                ? 0
                : selectedIdx - 1
            bus.trigger('select', {idx: selectedIdx})
        },
        down: () => {
            selectedIdx = selectedIdx === (list.length - 1)
                ? list.length - 1
                : selectedIdx + 1
            bus.trigger('select', {idx: selectedIdx})
        },
        select: (idx) => {
            if(idx < 0) selectedIdx = 0
            else if(idx > (list.length - 1)) selectedIdx = list.length -1
            else selectedIdx = idx
            bus.trigger('select', selectedIdx)
        },
        addAll: (items) => {
            items.forEach(manager.add)
        },
    }

    return manager
}

module.exports = {
    Track,
    TrackList,
}
