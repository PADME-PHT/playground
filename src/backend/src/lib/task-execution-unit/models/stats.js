/**
 * Class that holds stats of a container
 */
class ContainerStat 
{
    constructor(cpu_total, memory_total, cpu_system_total, number_pids, rx_bytes, tx_bytes, timepoint=undefined) {
        this.cpu_total = cpu_total
        this.memory_total = memory_total
        this.cpu_system_total = cpu_system_total
        this.number_pids = number_pids
        this.rx_bytes = rx_bytes
        this.tx_bytes = tx_bytes
        this.timepoint = timepoint
    }
}

module.exports = ContainerStat