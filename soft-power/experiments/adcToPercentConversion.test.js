const adcRaw = [0, 1023] // range of raw adc values
const adcPercentRaw = [843, 1023] // raw adc values to consider to be 0% and 100%

const rawAdcToPercent = x => {
    if(x <= adcPercentRaw[0]) return 0
    else if(x >= adcPercentRaw[1]) return 100
    else return Math.floor((x - adcPercentRaw[0]) / (adcPercentRaw[1] - adcPercentRaw[0]) * 100)
}

const printRange = () => {
    for(let i = adcRaw[0]; i <= adcRaw[1]; i++) {
        console.log(`${i} --> ${rawAdcToPercent(i)}%`)
    }
}

test('It works for various values', () => {
    expect(rawAdcToPercent(10)).toBe(0)
    expect(rawAdcToPercent(adcPercentRaw[0])).toBe(0)
    expect(rawAdcToPercent(adcPercentRaw[1])).toBe(100)
})
