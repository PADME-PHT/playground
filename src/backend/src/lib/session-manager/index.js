const TaskExecutionUnit = require('./../../lib/task-execution-unit');
const log = require("loglevel").getLogger("sessionManager");
const Session = require("./../models/session");
const Station = require('./../models/station');
const Mutex = require('async-mutex').Mutex;
const {v4: uuid} = require('uuid');
const _ = require('lodash'); 
const { exist } = require('joi');
const { logger } = require('../../config/components/logger');

class SessionManager
{
  //------------------ Properties ------------------
  #sessions;
  #cleanupInterval;
  #cleanupAfterSek;
  #executionUnit;
  #sessionLock;

  //------------------ Constructor ------------------

  /**
   * @returns A singleton SessionManager object
   */
  constructor() {
    //Ensure only one SessionManager can be created
    if (SessionManager._instance) {
        return SessionManager._instance;
    }
    SessionManager._instance = this;

    //Properties
    this.#executionUnit = new TaskExecutionUnit();
    this.#sessionLock = new Mutex();
    this.#sessions = {}
    this.#cleanupInterval = undefined;
    this.#cleanupAfterSek = 90 * 60; //cleanup after 1,5 hours
  }

  //------------------ private Methods ------------------
  /**
   * Method that is executed to cleanup old sessions after a certain time
   */
  async #removeOldSessions(self)
  {
    log.info("Cleanup of old sessions started");

    //Check if sessions can be disposed, if yes, remove
    let startCount = _.keys(self.#sessions).length;
    let removeTime = new Date(Date.now() - (self.#cleanupAfterSek * 1000));
    let removalIds = [];

    //Ensure that no job is currently being updated while we cleanup
    await self.#sessionLock.runExclusive(() => {
      for (let sessionKey of _.keys(self.#sessions)) {
        if (self.#sessions[sessionKey] && self.#sessions[sessionKey].lastTimeAccessed <= removeTime) {
          log.info(`Cleaning up session with id ${self.#sessions[sessionKey].id}`);
          removalIds.push(self.#sessions[sessionKey].id);
          delete self.#sessions[sessionKey];
        }
      }
    });
   
    //Dispose them all in the execution Unit
    await Promise.all(removalIds.map(id => self.#executionUnit.disposeSession(id))).catch(e => {
      log.error(`Cleanup of some sessions failed`);
      log.error(e);
    });

    //Doone
    let endCount = _.keys(self.#sessions).length;
    log.info(`Cleanup of old sessions workers finished, removed ${startCount - endCount} session, ${endCount} remaining`);
  }

  //------------------ public Methods ------------------

  /**
  * Create a new session and assigns an id
  * @param {Station[]} stations contains station of the session and their data sources
  * @returns 
  */
  createSession(stations)
  {
    let session = new Session(uuid(), stations);
    this.#sessions[session.id] = session; 
    return session;
  }

  /**
   * 
   * @param {string} sessionId The id of the job session
   * @returns {Session | undefined} the session if it was found
   */
  async lookupSession(sessionId)
  {
    let exists;
    await this.#sessionLock.runExclusive(() => {
      exists = this.#sessions[sessionId];
    });
    return exists ? exists : undefined;
  }

  /**
   * Updates the session to be last accessed now
   * @param {*} sessionId 
   */
  async updateSessionAccessTime(sessionId)
  {
    await this.#sessionLock.runExclusive(() => {
      let exists = this.#sessions[sessionId];
      if (exists)
      {
        exists.updateAccessTime();
      }
    });
  }

  /**
   * Starts a interval in the background that cleanups old sessions from the lookupTable
   */
  startCleanup()
  {
      if (!this.#cleanupInterval)
      {
        //Call removeOldSessions every 15 minutes
        let time_ms = 900000;
        let self = this;
        log.info(`Starting background interval for cleanup. Executing every ${time_ms/1000} sek.`);
        this.#cleanupInterval = setInterval(this.#removeOldSessions, time_ms, self);
      }
  }
  
  /**
   * Stops the background cleanup interval
   */
  dispose()
  {
    if(this.#cleanupInterval)
    {
      log.info("Stopping background interval for cleanup");
      clearInterval(this.#cleanupInterval);
      //Cleanup all remaining sessions
      log.info("Removing all remaining sessions");
      this.#cleanupAfterSek = 0;
      this.#removeOldSessions(this);
    }
  }
}

module.exports = SessionManager