const {
    getMaximumMemoryUsage,
    calulateCPUPercentage,
    getMaximumCPUPercentage,
} = require("../utils/ContainerStatsRecorder");
const ContainerStat = require("../models/stats")

test("Maximum memory consumption is correct", () => {
    const stats = []
    stats.push(new ContainerStat(0, 50, 0))
    stats.push(new ContainerStat(0, 500, 0))
    stats.push(new ContainerStat(0, 34, 0))
    stats.push(new ContainerStat(0, 2, 0))
    expect(getMaximumMemoryUsage(stats)).toBe(500)
})

test("CPU Percentage calculation is correct", () => {
    const stats = []
    stats.push(new ContainerStat(0, 10, 0))
    stats.push(new ContainerStat(10, 10, 100))
    expect(getMaximumCPUPercentage(stats)).toEqual(10.0)
})

test("CPU Percentage calculation is correct with  0", () => {
    const stats = []
    stats.push(new ContainerStat(0, 10, 0))
    stats.push(new ContainerStat(0, 10, 100))
    expect(getMaximumCPUPercentage(stats)).toEqual(0)
})