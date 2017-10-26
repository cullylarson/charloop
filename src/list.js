function Item(title, data) {
    return {title, data}
}

function List(blessedList) {
    const items = []
    let selectedIdx = 0

    const manager = {
        add: (item) => {
            items.push(item)
            blessedList.add(item.title)
        },

        up: () => {
            selectedIdx = selectedIdx === 0
                ? 0
                : selectedIdx - 1

            blessedList.select(selectedIdx)
        },

        down: () => {
            selectedIdx = selectedIdx === (items.length - 1)
                ? items.length - 1
                : selectedIdx + 1

            blessedList.select(selectedIdx)
        },

        getSelected: () => {
            return items.length
                ? items[selectedIdx]
                : undefined
        },

        addAll: (items) => {
            items.forEach(manager.add)
        },
    }

    return manager
}

module.exports = {
    Item,
    List,
}
