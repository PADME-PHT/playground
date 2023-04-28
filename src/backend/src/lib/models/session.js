const Station = require('./station');

/**
 * Class that holds all references for a session
 */
class Session
{
  /**
   * 
   * @param {*} id the id the new session should have
   * @param {Station[]} stations contains station of the session and their data sources
   */
  constructor(id, stations)
  {
    this.id = id;
    this.lastTimeAccessed = Date.now();
    this.stations = stations;
  }

  /**
   * Sets the last access time to now
   */
  updateAccessTime()
  { 
    this.lastTimeAccessed = Date.now();
  }

  
}

module.exports = Session