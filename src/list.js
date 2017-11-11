const {colors} = require('./menu')

function Item(title, data = {}) {
    return {title, data}
}

function List(blessedList) {
    const items = []
    let selectedIdx = 0
    let styleBeforeEngaged
    let engaged = false

    const manager = {
        add: (item) => {
            items.push(item)
            blessedList.add(item.title)
        },

        setSelectedTitle: (title) => {
            blessedList.setItem(selectedIdx, (engaged ? '{bold}' : '') + title + (engaged ? '{/bold}' : ''))
        },

        engage: () => {
            engaged = true
            styleBeforeEngaged = blessedList.style.selected

            blessedList.style.selected = {
                fg: 'white',
                bg: colors.CornflowerBlue,
            }

            // reset the title so it will be bold
            manager.setSelectedTitle(blessedList.getItem(selectedIdx).getText())
        },

        disengage: () => {
            engaged = false
            if(styleBeforeEngaged) blessedList.style.selected = styleBeforeEngaged
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
