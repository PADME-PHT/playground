const SessionLog = require("./sessionLog");
const EventEmitter = require('events');

//Holds all information that the Task Execution Unit needs to have about a session
//emits 'canceled' event when the current execution should be canceled
class SessionInfo extends EventEmitter
{
  constructor(id, provisionResults, logger)
  {
    super();
    this.id = id;
    this.logger = logger;
    this.provisionResults = provisionResults;
    this.isExecuting = false;
    this.shouldCancel = false;
    this.logs = [];
    this.images = [];
    this.networks = {}
    this.changes = [];
    this.stats = [];
    // stores for each station id hwo much the virtual size increased
    this.stationStorageIncreasement = {}
  }

  /**
   * 
   * @param {*} changes 
   */
  setChanges(changes)
  {
    this.changes = changes;
  }

  /**
   * Adds a image to the list of images that were build/committed for this session
   * @param {*} imageName 
   */
  addImage(imageName)
  {
    this.images.push(imageName);
  }

  notifyCancelation()
  {
    this.shouldCancel = true; 
    this.emit("canceled");
  }

  /**
   * @returns the name of the last images that was build for this session
   */
  getLastImage()
  {
    return this.images.length > 0 ? this.images[this.images.length - 1] : "";
  }

  /**
   * Adds a network that should be used for the given station id
   * @param {*} stationId 
   * @param {*} networkId 
   */
  addNetworkForStation(stationId, networkId)
  {
    this.networks[stationId] = networkId;
  }
  
  /**
   * Returns the name of the network that should be used for the given station
   * @param {*} stationId 
   */
  getNetworkForStation(stationId)
  {
    return this.networks[stationId];
  }

  /**
   * Updates the status, whether the session is currently executing
   * (important to not have two executions at the same time)
   * @param {*} executing 
   */
  updateExecutionStatus(executing)
  {
    this.isExecuting = executing;
    this.shouldCancel = false;
  }

  /**
   * Removes logs from previous executions
   */
  clearLogs()
  {
    this.logs = [];
  }

  /**
   * Returns all logs that have been recorded since the provided log id (that have a log id > the given log id)
   * @param {*} id the log id
   * @returns {SessionLog[]}
   */
  getLogsSinceId(id)
  {
    if (id < 0)
    {
      return this.logs.slice(0);
    }
    return this.logs.slice(id + 1);
  } 

  /**
   * Adds a log message that should be displayed to the user
   * @param {logType} type The type of log message
   * @param {string} message the message itself 
   * @param {string} stationId If applicable, the id of the station this log is referring to
   * (which station is currently visited in the route) 
   */
  addLog(type, message, stationId = '')
  {
    this.logs.push(new SessionLog(this.logs.length, type, message, stationId));
  }

  /**
   * Adds a stat crawled during this session
   * @param {*} stat A stats object containing the stats
   */
  addStat(stat) 
  {
    this.stats.push(stat);
  }
}

module.exports = SessionInfo