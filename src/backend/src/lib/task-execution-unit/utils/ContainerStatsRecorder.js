const ContainerStat = require("../models/stats");
const EventEmitter = require('events');

function getMaximumMemoryUsage(stats) {
    let max_mem = 0;
    for (const stat of stats) {
        if (stat.memory_total!=undefined) {
            max_mem = Math.max(max_mem, stat.memory_total);
        }
    }
    return max_mem;
}
// https://stackoverflow.com/questions/30271942/get-docker-container-cpu-usage-as-percentage
function calulateCPUPercentage(previous_system, previous_cpu, stat) {
    const cpu_delta = stat.cpu_total - previous_cpu;
    const system_delta = stat.cpu_system_total - previous_system;
    if (cpu_delta > 0 && system_delta > 0) {
        // reasonable in this context to multiply with number of cpus? 
        return (cpu_delta / system_delta) * 100.0;
    }
    return 0;
}

function getMaximumCPUPercentage(stats) {
    let previous_system = 0;
    let previous_cpu = 0;
    let maximum = 0
    let first = true;
    for (const stat of stats) {
        // skip the first value
        if (first) {
            first = false;
        } else {
            maximum = Math.max(calulateCPUPercentage(previous_system, previous_cpu, stat), maximum);
        }
        previous_system = stat.cpu_system_total;
        previous_cpu = stat.cpu_total;
    }
    return maximum;
}

function getMaximumNumberPids(stats) {
    let max_num_pid = 0;
    for (const stat of stats) {
        if (stat.number_pids!=undefined) {
            max_num_pid = Math.max(max_num_pid, stat.number_pids);
        }
    }
    return max_num_pid;
}

function getMaximumRXBytes(stats) {
    let max_rx_bytes = 0;
    for (const stat of stats) {
        if (stat.rx_bytes != undefined) {
            max_rx_bytes = Math.max(max_rx_bytes, stat.rx_bytes);
        }
    }
    return max_rx_bytes;
}

function getMaximumTXBytes(stats) {
    let max_tx_bytes = 0;
    for (const stat of stats) {
        if (stat.tx_bytes != undefined) {
            max_tx_bytes = Math.max(max_tx_bytes, stat.tx_bytes);
        }
    }
    return max_tx_bytes;
}

/**
 * Class the records the stats of a given container until it finished or it is aborted
 * emits an event 'stat' if it encounters a new stat with the ContainerStat object as only argument
 * 
 */
class StatsRecorder extends EventEmitter
{

    STAT_EVENT = "stat"
    /**
     * 
     * @param {*} container The container from which the stats are recorded 
     * @param {*} periodicity The periodicy with which it should be recorded
     */
    constructor(container, periodicity=5000) 
    {
        super();
        this.container = container;
        this.periodicity = periodicity;
        this.buffer = [];
        // flag for stopping recording
        this.stop_loop = false;
        // flag for indicating whether it started
        this.started = false;
    }

    /**
     * Start recording
     */
    async start()
    {
        if (this.started) {
            return;
        }
        this.started = true;

        const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
        while (!this.stop_loop) {
            this.#record();
            await sleep(this.periodicity);
        }
    }

    /**
     * stop recording
     */
    stop()
    {
        this.stop_loop = true;
    }

    /**
     * sums rx_bytes from all network interfaces
     */
    #aggregate_network_read(stat) {
        try {
            //No network stats
            if (!stat.networks) return 0;

            let rx_bytes = 0;
            for (const eth_interface of Object.keys(stat.networks)) {
                rx_bytes = stat.networks[eth_interface].rx_bytes + rx_bytes;
            }
            return rx_bytes;
        } catch(err) {
            console.error(err)
            return 0;
        }
    }

    /**
     * sums tx_bytes from all network interfaces
     */
    #aggregate_network_transmitted(stat) {
        try {
            //No network stats
            if (!stat.networks) return 0;

            let tx_bytes = 0;
            for (const eth_interface of Object.keys(stat.networks)) {
                tx_bytes = stat.networks[eth_interface].tx_bytes + tx_bytes;
            }
            return tx_bytes;
        } catch (err) {
            console.error(err)
            return 0;
        }
    }

    /**
     * Record a stat
     */
    async #record() {
        const dockerode_res = await this.container.stats({stream: false});
        try {
            const new_stat = new ContainerStat(
                dockerode_res.cpu_stats.cpu_usage.total_usage,
                dockerode_res.memory_stats.usage,
                dockerode_res.cpu_stats.system_cpu_usage,
                dockerode_res.pids_stats.current,
                this.#aggregate_network_read(dockerode_res),
                this.#aggregate_network_transmitted(dockerode_res),
                new Date(dockerode_res.read),
            );
            this.emit(this.STAT_EVENT, new_stat)
        } catch (err) {
            console.warn(err)
            console.warn("Error while recording container stats!")
        }
    }
}

module.exports = {
    getMaximumMemoryUsage,
    calulateCPUPercentage,
    getMaximumCPUPercentage,
    getMaximumNumberPids,
    getMaximumRXBytes,
    getMaximumTXBytes,
    StatsRecorder,
}