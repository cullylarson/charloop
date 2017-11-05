module.exports = function(id, num, title, filePath) {
    return {
        id,
        num,
        title,
        titleWithNum: num.toString().padStart(2, '0') + ' - ' + title,
        filePath,
    }
}
