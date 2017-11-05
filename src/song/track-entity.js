module.exports = function(id, num, title, filePath) {
    return {
        id,
        num,
        title,
        titleWithNum: `${num} - ${title}`,
        filePath,
    }
}
