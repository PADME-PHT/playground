const ProvisionEnv = require("../source-provisioner/models/provision-env");
const DataSourceProvisioner = require('./../source-provisioner');
const { StatsRecorder, getMaximumMemoryUsage, getMaximumCPUPercentage, getMaximumNumberPids, getMaximumTXBytes, getMaximumRXBytes } = require("./utils/ContainerStatsRecorder")
const log = require("loglevel").getLogger("sessionManager");
const ChangedElement = require("./models/changedElement");
const SessionInfo = require('./models/sessionInfo');
const dockerUtil = require('./../../utils/docker');
const SessionLog = require("./models/sessionLog");
const changeType = require("./models/changeType");
const { pipeline } = require('stream/promises');
const Session = require("./../models/session");
const Station = require('./../models/station');
const docker = require("./../../utils/docker");
const LogType = require('./models/logTypes');
const { constants } = require("buffer");
const EventEmitter = require('events');
const { Readable } = require("stream");
const { v4: uuid } = require('uuid');
const tar = require('tar-stream');
const _ = require('lodash'); 
const path = require('path');
const e = require("express");

/**
 *  Emits a newLog event that provides the session id whenever there is a update for a specific session
 */
class TaskExecutionUnit extends EventEmitter
{
  //------------------ Properties ------------------
  #provisioner;
  //Used to lookup infos about the session needed for the execution and cleanup
  #sessionLookup;

  //------------------ Constructor ------------------

  /**
   * @returns A singleton DataSourceProvisioner object
   */
  constructor() {
    super();
    //Ensure only one TaskExecutionUnit can be created
    if (TaskExecutionUnit._instance) {
      return TaskExecutionUnit._instance;
    }
    TaskExecutionUnit._instance = this;
    
    this.#provisioner = new DataSourceProvisioner();
    this.#sessionLookup = {};
  }

  //------------------ internal methods ------------------

  /**
   * Creates the data sources for the given session
   * @param {*} session The session to create the sources for
   * @param {object[]} networks list of networks for the stations of the session
   * @returns {[object]} A list of objects describing each station and information about the data source provisioned for this station 
   */
  async #provisionDataSourcesForSession(session, networks)
  {
    //First, check if provisioning is possible (quicker, no cleanup needed if not)
    //Throws exception if not
    this.#provisioner.canProvisionSourcesForStation(session.stations);

    //Provision all stations in parallel
    let promises = session.stations.map(station =>
    {
      return new Promise(async (accept, reject) => {
        try {
          let networkName = _.find(networks, { station: station.id }).network;
          let info = await this.#provisioner.provisionSourcesForStation(station, networkName); 
          accept({
            stationId: station.id,
            info: info
          });
        } catch (err)
        {
          reject(err);
        }
      });
    })

    //TODO: Revert on error
    return await Promise.all(promises);
  }

  /**
   * strips all ansi characters from the given message
   * @param {string} message 
   * @returns 
   */
  #stripAnsi(message)
  {
    //Source: https://stackoverflow.com/a/29497680/5589776 
    return message.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
  }

  /**
   * Adds a logMessage to the given session and notifies subscribers about the new log
   * @param {*} sessionId 
   * @param {*} logType 
   * @param {*} message 
   * @param {*} stationId 
   */
  #addLogToSession(self, sessionId, logType, message, stationId = '')
  {
    //Print debug/error to internal logging
    if (message)
    {
      //Remove any ansi command characters
      message = this.#stripAnsi(message);
      switch (logType)
      {
        case LogType.Error: 
          self.#sessionLookup[sessionId].logger.error(message);
        default: 
          self.#sessionLookup[sessionId].logger.debug(message);
      }
    }

    //Add to session
    self.#sessionLookup[sessionId].addLog(logType, message, stationId);

    //Notify subscribes
    this.emit('newLog', sessionId);
  }
  /**
   * Returns a buffer for the given file that can be put into the tar archive
   * @param {*} file 
   * @returns 
   */
  #getBufferForFile(file)
  {
    if (file.content)
    {
      if (typeof file.content == 'string')
      {
        return Buffer.from(file.content, 'utf-8')
      } else
      {
        return file.content
      }
    }
    return "";
  }

  /**
   * Asynchronously 
   * @param {*} sessionId 
   * @param {*} content 
   */
  async #fillTarStream(tarStream, sessionId, content)
  {
    for (let file of content)
    {
      //Add the file to the tar archive
      let entryAsync = new Promise(async (accept, reject) => {
        tarStream.entry({ name: file.name}, this.#getBufferForFile(file), (err) => {
          if (err) {
            reject(err);
          } else
          {
            accept();
          }
        });
      }); 
      await entryAsync.catch(err => {
        log.error(`Something went wrong while adding ${file.name} for execution in session ${sessionId}`);
        log.error(err);
      });
      
      log.debug(`Added file ${file.name} for execution in session ${sessionId}`);
    }
    tarStream.finalize();
  }

  /**
   * @param {*} content array of content that should be packed into the stream
   * @returns A tar stream
   */
  async #getTarArchiveFromContent(sessionId, content)
  {
    //Create tar stream from all send files
    let tarStream = tar.pack();
    //The tar stream is filled asynchronous (no await here on purpose!)
    //this is quite important because the stream needs to be read in order for the implementation to work
    //otherwise, everything will wait forever as soon as the tar stream hits its internal buffer limit (usually 16kb)
    this.#fillTarStream(tarStream, sessionId, content);
    return tarStream;
  }

  /**
   * Builds the latest image for execution in the given sessionId
   * @param {*} sessionId 
   * @param {*} content 
   * @return Whether the image could be build
   */
  async #buildImageForExecution(sessionId, content)
  {
    log.info(`Building image for session ${sessionId}`);
    let self = this;
    self.#addLogToSession(self, sessionId, LogType.BuildStart);
    let stream = await this.#getTarArchiveFromContent(sessionId, content);
    let imageName = uuid();
    return await dockerUtil.buildImageFromTarArchive(stream, imageName, (log) => {
      //Do no print empty lines
      if (log) {
        self.#addLogToSession(self, sessionId, LogType.Build, log);
      }
    }).catch(e => {
      self.#addLogToSession(self, sessionId, LogType.Error, e);
      self.#addLogToSession(self, sessionId, LogType.Error, 'Building docker image failed, please look at the logs above');
      return false;
    }).then((res) =>
    {
      if (res === false) 
      {
        return res;
      } else
      {
        self.#sessionLookup[sessionId].addImage(imageName);
        self.#addLogToSession(self, sessionId, LogType.BuildEnd);
        log.info(`Image for session build ${sessionId}`);
        return true;
      }
    });
  }
  
  /**
   * Resolves the environment variables from the station info and provision results that
   * should be used for execution at a specific station
   * @param {*} stationInfo 
   * @param {*} provisionResult 
   */
  #resolveEnvVariables(stationInfo, provisionResult)
  {
    let envs = [];

    //first, the environment variables from the provisioning
    for (let env of provisionResult.envs)
    {
      //Look, if this env also exists in the stationInfo (e.g. changed name)
      let name = env.name;
      let counterPart = _.find(stationInfo.envs, { id: env.id })
      if (counterPart)
      {
        name = counterPart.name;
      }
      //If the counter part defines an value, we use this
      //This can be used to update envs to e.g. communicate to outside servers
      const value = counterPart.value ? counterPart.value : env.value;
      envs.push(`${name}=${value}`);
    }

    //Then the ones that are defined by the users
    if (stationInfo.ownEnvs)
    {
      for (let env of stationInfo.ownEnvs)
      {
        envs.push(`${env.name}=${env.value}`);  
      }
    }
    
    return envs;
  }

  /**
   * Returns the provision results for the given station and sessionId
   * @param {*} sessionId 
   * @param {*} stationId 
   */
  #getProvisionResultForStation(sessionId, stationId)
  {
    let sessionInfo = this.#sessionLookup[sessionId];
    let results = _.find(sessionInfo.provisionResults, { stationId: stationId });
    return results.info;
  }

  /**
   * Starts the given container, waits for it to finish and checks the exit code
   * @param {*} container 
   */
  async #startContainerAndWaitForFinish(container, sessionId, stationInfo)
  {
    let self = this;
    const statRecorder = new StatsRecorder(container);
    // if a stat is emitted, add it to the stats array
    statRecorder.on(statRecorder.STAT_EVENT, async (new_stat) => {
      this.#sessionLookup[sessionId].addStat(new_stat);
    })
    
    //Start container and get logs
    await container.start();
    statRecorder.start();
    //subscribe on cancel (important: first, subscribe, then check: otherwise, the event might be missed)
    let canceled = async () => {
      //Stop the container immediately
      await container.stop({ t: 0 });
      statRecorder.stop();
    };
    this.#sessionLookup[sessionId].on('canceled', canceled);
    if (this.#sessionLookup[sessionId].shouldCancel)
    {
      this.#sessionLookup[sessionId].off('canceled', canceled);
      await canceled();
      return; 
    }
    
    //Write logs to console
    dockerUtil.writeContainerLogsToLogger(container, (content) => {
      self.#addLogToSession(self, sessionId, LogType.Execution, content, stationInfo.id);
    }, (err) => {
      self.#addLogToSession(self, sessionId, LogType.Error, err, stationInfo.id);
    });

    //Wait for container to finish
    let response = await container.wait();
    this.#sessionLookup[sessionId].off('canceled', canceled);
    statRecorder.stop();

    if (response.StatusCode != 0) {
      self.#addLogToSession(self, sessionId, LogType.Error, `Container existed with non zero exit code ${response.StatusCode}`, stationInfo.id);
      throw new Error(`Execution failed because container exited with code ${response.StatusCode} and message ${response.Error?.Message}`, true);
    }
  }

  /**
   * Checks if the path is a file
   * @param {*} path 
   * @returns 
   */
  #isFile(sourcePath)
  {
    let last = sourcePath.split('/').pop();
    return path.extname(last) ? true : false;
  }

  /**
   * Extracts one file from the given archive
   * @param {*} archiveStream The stream to extract the data from
   * @param {*} filePath the file to extract
   * @returns A array containing the file data
   */
  async #extractFileFromArchive(archiveStream, filePath)
  {
      return new Promise(async (resolve, reject) => {
          try{
              let extractContents = tar.extract();
              var data = [];
              extractContents.on('entry', function (header, stream, next) {
          
                  //Read file content
                  stream.on('data', function(chunk) {
                  if (header.name == filePath)
                      data.push(chunk);
                  });
                  
                  //Get next element
                  stream.on('end', function() {
                      next();
                  });
          
              }).on('finish', function () {
                  resolve(data);
              });
              archiveStream.pipe(extractContents);
          } catch(err)
          {
              reject(err);
          }
      });   
  }

  /**
   * Extracts resources from the given path from the latest execution image
   * @param {*} sessionId 
   * @param {*} path 
   */
  async #extractFromExecution(sessionId, path)
  {
    let lookup = this.#sessionLookup[sessionId];
    //Create temporary container
    let temp;
    try {
      temp = await dockerUtil.createContainerFromImage(lookup.getLastImage()); 
      let stream = await temp.getArchive({ path: path });
      if (this.#isFile(path))
      { 
        //Extract the file and return as a stream
        let file = await this.#extractFileFromArchive(stream, path.split('/').pop());
        stream = Readable.from(file);
      }
      //Return the stream
      stream.cleanup = () => {
        temp.remove();
      }
      return stream; 
    } catch (e)
    {
      this.#sessionLookup[sessionId].logger.error(`Failed to extract ${path} from latest image. Error:`); 
      this.#sessionLookup[sessionId].logger.error(e);
      temp.remove();
      return undefined;
    }
  }

  /**
   * Creates a tree from what the changes paths send by the docker engine
   * @param {*} changes 
   * @returns 
   */
  #treeify(changes) {
    //Credit: https://stackoverflow.com/a/57344801/5589776
    let result = [];
    let level = {result};
    
    changes.forEach(elem => {
      elem.Path.split('/').slice(1).reduce((r, name, i, a) => {
        if(!r[name]) {
          r[name] = {result: []};
          r.result.push(new ChangedElement(name, a.slice(0,i+1).join('/'), elem.Kind, r[name].result))
        }
        
        return r[name];
      }, level)
    });
    return result;
  };

  /**
   * Merges two changes together, returns a new change tree
   * @param {[ChangedElement]} oldChanges 
   * @param {[ChangedElement]} newChanges
   * @returns {[ChangedElement]} a merged list of changes
   */
  #mergeChanges(oldChanges, newChanges)
  {
    //First, two default cases
    if (oldChanges == []) return newChanges;
    if (newChanges == []) return oldChanges;

    //Now, check the elements and do recursion
    //First, merge both together
    let merge = {};
    let addToMerge = (elem) => {
      if (!merge[elem.path]) {
        merge[elem.path] = [];
      }
      merge[elem.path].push(elem);
    }
    //IMPORTANT: old changes first
    oldChanges.forEach(elem => addToMerge(elem)); 
    newChanges.forEach(elem => addToMerge(elem));

    //Resolve the conflicts (elements where both changed)
    let conflicts = _.keys(merge).filter(key => merge[key].length > 1);
    for (let key of conflicts) {
      let array = merge[key];
      if (array[1].changeType == 2) {//In the new changes is this was deleted, then the old changes do not matter
        merge[key] = [ array[1] ];
      } else { //They are the same or one was added and the other modified or the other way around, then we simply take the latest and continue recursively
        let children = this.#mergeChanges(array[0].children, array[1].children);
        merge[key] = [ array[1] ];
        array[1].children = children;
      }
    }

    return _.values(merge).flat();
  }

  /**
   * Extracts the changes from the container, commits a new images and then removes the container
   * @param {*} container 
   */
  async #finalizeContainerExecution(container, sessionId)
  {
    // Get changes
    let changes = await container.changes();
    let tree = [];
    if (changes && changes.length > 0 && changes[0].Path)
    {
      tree = this.#treeify(changes);
    }
    //Merge with previous changes
    let merge = this.#mergeChanges(this.#sessionLookup[sessionId].changes, tree);
    this.#sessionLookup[sessionId].setChanges(merge);

    // Commit container to a new image
    let imageName = uuid();
    await container.commit({ repo: imageName });
    return imageName;
  }

  /**
   * Starts a container with the given name and changes the configuration for the given station
   * @param {sessionId} sessionId Id of the session to execute in
   * @param {string} imageName name of the image that should be used
   * @param {object} stationInfo Info about the station
   * @return Whether the execution was successful
   */
  async #executeInStation(sessionId, imageName, stationInfo) {
    let self = this;
    self.#addLogToSession(self, sessionId, LogType.ExecutionStart, '', stationInfo.id);
    let provisionResult = this.#getProvisionResultForStation(sessionId, stationInfo.id);
    let envs = await this.#resolveEnvVariables(stationInfo, provisionResult);
    //Create the container
    let container = await dockerUtil.createContainerFromImage(
      imageName,
      envs,
      this.#sessionLookup[sessionId].getNetworkForStation(stationInfo.id)
    );
    const previousSize = await dockerUtil.getImageSize(imageName)
    try
    {
      //Start container and wait for the execution to finish
      await this.#startContainerAndWaitForFinish(container, sessionId, stationInfo);
      
      //Return on cancel
      if (this.#sessionLookup[sessionId].shouldCancel)
      {
        return false;
      }

      //Extract changes and commit container
      let newImageName = await this.#finalizeContainerExecution(container, sessionId);
      this.#sessionLookup[sessionId].addImage(newImageName);

      //Add log of finished execution
      this.#addLogToSession(this, sessionId, LogType.ExecutionEnd, '', stationInfo.id);
      // record size difference
      const newSize = await docker.getImageSize(newImageName)
      this.#sessionLookup[sessionId].stationStorageIncreasement[stationInfo.id] = newSize - previousSize
    } catch (e)
    {
      log.error(`Execution in session ${sessionId} failed`);
      log.error(e);
      this.#addLogToSession(this, sessionId, LogType.Error, e.message);
      return false;
    } finally
    {
      // Remove container (always)
      await container.remove({force: true});
    }   
    return true;
  }

  /**
   * Creates all networks that are needed for the session
   * @param {*} stations A list of station that participate in the session
   * @returns {object[]} a list ob objects with the stationId and the corresponding network
   */
  async #createNetworksForSession(stations) {
    let promises = stations.map((station) => {
      return new Promise(async (accept, rej) => {
        try {
          let networkName = uuid();
          await dockerUtil.createNetwork(networkName); 
          accept({
            station: station.id,
            network: networkName
          });
        } catch (e)
        {
          rej(e);
        }
      });
    });
    return await Promise.all(promises);
  }

  /**
   * Removes all created data sources for the given session
   * @param {SessionInfo} sessionInfo 
   */
  async #disposeProvisionedSources(sessionInfo)
  {
    for (let result of sessionInfo.provisionResults)
    {
      for (let containerId of result.info.sourceContainerIds)
      {
        await dockerUtil.removeContainerById(containerId);
      }
    }
  }

  /**
   * Removes all docker networks that have been created for the given sessionInfo
   * @param {SessionInfo} sessionInfo 
   */
  async #disposeCreatedNetworks(sessionInfo)
  {
    for (let network of _.values(sessionInfo.networks))
    {
      await dockerUtil.removeNetworkById(network);
    }
  }

  /**
   * Removes all docker images that have been created during the session
   * @param {SessionInfo} sessionInfo 
   */
  async #disposeCreatedImages(sessionInfo)
  {
    for (let image of sessionInfo.images)
    {
      await dockerUtil.removeImage(image);
    }
  }

  //------------------ public methods ------------------

  /**
   * Initializes the resources for a new session
   * @param {Session} session
   * @returns {[object]} A list of objects describing each station and information about the data source provisioned for this station 
   */
  async initSession(session)
  {
    log.info(`Initializing session with id ${session.id}`);

    //Create a network for each station of the session
    let networks = await this.#createNetworksForSession(session.stations);
    
    //Provision the sources
    let res = await this.#provisionDataSourcesForSession(session, networks);
    log.info(`Successfully initialized session with id ${session.id}`);

    //Hold info internally (needed for execution and cleanup)
    let info = new SessionInfo(session.id, res, require("loglevel").getLogger(`execution - ${session.id}`));
    this.#sessionLookup[session.id] = info;

    //Add the created networks
    for (let result of networks)
    {
      info.addNetworkForStation(result.station, result.network);
    }

    return res;
  }

  /**
   * Checks whether the provided session can currently execute (if no other execution is running)
   * @param {*} sessionId 
   */
  canExecuteInSession(sessionId)
  {
    return !this.#sessionLookup[sessionId].isExecuting;
  }

  /**
   * Executes the provided info in the session with the given id
   * @param {string} sessionId 
   * @param {object} executionInfo object describing the execution
   */
  async executeInSession(sessionId, executionInfo)
  { 
    log.info(`Starting execution in session ${sessionId}`);
    this.#sessionLookup[sessionId].updateExecutionStatus(true);
    this.#sessionLookup[sessionId].clearLogs();

    let executionFailed = (self) => 
    {
      self.#addLogToSession(self, sessionId, LogType.ExecutionFailed);
      self.#sessionLookup[sessionId].updateExecutionStatus(false); 
    }

    //Execute
    try {
      //First: build image, also check if it could be build
      let res = await this.#buildImageForExecution(sessionId, executionInfo.content);
      if (!res || this.#sessionLookup[sessionId].shouldCancel)
      {
        executionFailed(this);
        return;
      }

      //Clear changes
      this.#sessionLookup[sessionId].setChanges([]);

      //Execute in every station of the route
      for (let station of executionInfo.route)
      {
        let res = await this.#executeInStation(sessionId, this.#sessionLookup[sessionId].getLastImage(), station);
        if (!res || this.#sessionLookup[sessionId].shouldCancel)
        {
          executionFailed(this);
          return;
        }
      }
    } catch (e)
    {
      log.error(`Execution in session ${sessionId} failed`);
      log.error(e);
      this.#addLogToSession(this, sessionId, LogType.Error, "Unexpected error during execution, please contact your administrator");
      executionFailed(this);
      return;
    }

    this.#addLogToSession(this, sessionId, LogType.ExecutionFinished);
    this.#sessionLookup[sessionId].updateExecutionStatus(false);
    log.info(`Execution in session ${sessionId} finished`);
  }

  /**
   * Returns the session logs for the given session that have been created since the given logId
   * @param {*} sessionId id of the session
   * @param {*} logId id of the first log to not include
   * @returns {[SessionLog]}
   */
  getSessionLogsSince(sessionId, logId)
  {
    return this.#sessionLookup[sessionId].getLogsSinceId(logId);
  }

  /**
   * @param {*} sessionId The id the of session to get the results from
   * @return {[changedElement] | undefined} A tree containing the changes in the session
   */
  getSessionResults(sessionId)
  {
    let lookup = this.#sessionLookup[sessionId]; 
    if (lookup.isExecuting)
    {
      return undefined;
    }
    return lookup.changes;
  }

  /**
   * @returns Dictionary containing the image size differences for each station.
   */
  getStationImageSizeDifferences(sessionId) {
    return this.#sessionLookup[sessionId].stationStorageIncreasement
  }

  /**
   * Cancels a execution in a session
   * @param {*} sessionId 
   */
  cancelExecution(sessionId)
  {
    let lookup = this.#sessionLookup[sessionId]
    if (lookup.isExecuting && ! lookup.shouldCancel)
    {
      this.#addLogToSession(this, sessionId, LogType.ExecutionCanceled, "Received message to cancel execution");
      lookup.notifyCancelation();
    }
  }

  /**
   * Returns the currently maximum cpu usage in percent at any time.
   */
  getMaximumCPUUsage(sessionId) {
    return getMaximumCPUPercentage(this.#sessionLookup[sessionId].stats)
  }

  /**
   * Returns the currently maximum memory usage by the train at any time
   */
  getMaximumMemoryUsage(sessionId) {
    return getMaximumMemoryUsage(this.#sessionLookup[sessionId].stats)
  }
  /**
   * Returns the currently maximum number of pids started by the train at any time
   */
  getMaximumNumberPids(sessionId) {
    return getMaximumNumberPids(this.#sessionLookup[sessionId].stats)
  }
  /**
   * Returns the maximum network usage as a dict with tx_bytes and rx_bytes keys
   * @param {*} sessionId the session id for which the maximum value is returned 
   */
  getMaximumNetworkUsage(sessionId) {
    return {
      tx_bytes: getMaximumTXBytes(this.#sessionLookup[sessionId].stats),
      rx_bytes: getMaximumRXBytes(this.#sessionLookup[sessionId].stats),
    }
  }
  /**
   * Extracts specific files from the session results
   * @param {*} sessionId 
   * @param {*} path 
   * @returns Stream to a tar archive with the extracted info. When finished, cleanup should be called on the stream
   */
  async extractFromSessionResults(sessionId, path)
  {
    let lookup = this.#sessionLookup[sessionId]; 
    if (lookup.isExecuting || lookup.images.length == 0)
    {
      return undefined;
    }

    return await this.#extractFromExecution(sessionId, path);
  }

  /**
   * Cleans up the resources used for the provided session
   * @param {Session} sessionId
   */
  async disposeSession(sessionId)
  {
    let lookup = this.#sessionLookup[sessionId];

    //remove sessionLookup
    delete this.#sessionLookup[sessionId];

    //Remove all container (running instantiated data sources)
    await this.#disposeProvisionedSources(lookup);

    //Remove the created networks
    await this.#disposeCreatedNetworks(lookup); 

    //Remove all images
    await this.#disposeCreatedImages(lookup);
  }
}

module.exports = TaskExecutionUnit