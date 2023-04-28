const TaskExecutionUnit = require('./../../lib/task-execution-unit');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const log = require("loglevel").getLogger("sessionController");
const SessionManager = require('./../../lib/session-manager');
const ResponseError = require("../models/response-error");
const QueryEngine = require('./../../lib/query-engine');
const { UserError } = require('../../lib/models/errors');
const { keycloak } = require('./../../utils/keycloak');
const Mutex = require('async-mutex').Mutex;
const WaitQueue = require('wait-queue');
const { Router } = require('express');
const joi = require('joi');

const sessionRouter = Router(); 
const queryEngine = new QueryEngine();
const sessionManager = new SessionManager(); 
const executionUnit = new TaskExecutionUnit();
const sessionLock = new Mutex();

//------------------ internal methods ------------------
//schema used to validate new sessions
const createSchema = joi.array().items(
  joi.object(
    {
      id: joi.string().required(),
      stations: joi.array().items(
        joi.object({
          id: joi.string().guid().required(),
          datasets: joi.array().items(
            joi.object(
              {
                id: joi.string().required()
              }
            )
          ).min(1).required()
        })
      ).min(1).required()
    }
  )
).min(1).required();

//schema used to validate executions in sessions
const executionSchema = joi.object(
  {
    route: joi.array().items(
      joi.object(
        {
          id: joi.string().guid().required(),
          envs: joi.array().items(
            joi.object(
              {
                id: joi.string().guid().required(), 
                name: joi.string().required(),
                //This value can be used to overwrite default values.
                //Useful for e.g. connecting to external servers
                value: joi.string().optional(), 
              }
            )
          ), 
          ownEnvs: joi.array().items(
            joi.object(
              {
                name: joi.string().required(), 
                value: joi.string().required(),
              }
            )
          ), 
        }
      )
    ).min(1).required(),
    content: joi.array().items(
      joi.object(
        {
          name: joi.string().required(),
          contentType: joi.string().valid('plain', 'binary').required(),
          content: joi.alternatives().conditional('contentType', {
            is: 'plain', 
            then: joi.string().empty(''), 
            otherwise: joi.binary().encoding('base64')
          })
        }
      )
    ).min(1).required()
  }
);

/**
 * Loads the stations and related datasets for the provided session info
 * @param {*} sessionInfo 
 * @returns 
 */
const loadDataForSession = async (sessionInfo) =>
{
  let stations = []; 
  let mutex = new Mutex();
  //For all organizations and stations
  let promises = sessionInfo.flatMap(orga => 
    orga.stations.map(async (st) => 
    {
      //Fetch the Station Info
      let station = await queryEngine.getStation(orga.id, st.id);

      //Fetch the datasets
      let dsPromises = st.datasets.map(dataset => {
        return queryEngine.getDataset(orga.id, station.id, dataset.id)
      })

      station.setDatasets(await Promise.all(dsPromises));

      //Add station to the array
      return mutex.runExclusive(() => {
        stations.push(station);
      })
    }) 
  )

  await Promise.all(promises);

  return stations;
}

/**
 * Builds the session result object from the provided information
 * @param {*} session 
 * @param {*} provisionRes 
 */
const buildSessionResult = (session, provisionRes) =>
{
  return {
    id: session.id, 
    stations: provisionRes.map(result => 
    {
      return {
        id: result.stationId, 
        envs: result.info.envs.map(env =>
        {
          return {
            id: env.id,
            name: env.name,
            value: env.value,
            description: env.description
          }
        })
      }
    })
  }
}

//------------------ public endpoints ------------------
sessionRouter.post('/sessions/', keycloak.protect(), async (req, res) => {
  //validate the input
  let { error, value: sessionInfo } = createSchema.validate(req.body); 
  if (error)
  {
    res.status(400).send(error.details.map((detail) => detail.message)); 
    return;
  } 

  //get all the data for the given ids
  let stations = await loadDataForSession(sessionInfo);

  //create new session
  let session = sessionManager.createSession(stations);

  //Init session with Task Execution Unit
  let result;
  try {
    result = await executionUnit.initSession(session);
  } catch (err)
  {
    if (Object.getPrototypeOf(err) instanceof UserError)
    {
      res.status(500).send(new ResponseError(err.message));  
    } else {
      log.error(err);
      res.status(500).send(new ResponseError("Unexpected error, please contact your administrator"));  
    }
    return;
  }
 
  res.status(200).send(buildSessionResult(session, result));
});

//Execute run within a session
sessionRouter.post('/sessions/:id/execution', keycloak.protect(), async (req, res) => {
  let sessionId = req.params.id;
  let session = await sessionManager.lookupSession(sessionId);

  if (!session)
  {
    res.status(404).send();  
    return;
  }

  //Validate data
  let { error, value: executionInfo } = executionSchema.validate(req.body); 
  if (error)
  {
    res.status(400).send(error.details.map((detail) => detail.message)); 
    return;
  }
  
  //Prevent multiple executions in the session from starting at the same time
  sessionLock.runExclusive(async() => {
    if (executionUnit.canExecuteInSession(sessionId)) {
      //Update the last access time to the current time
      await sessionManager.updateSessionAccessTime(sessionId);
      //No wait here: should run in background
      executionUnit.executeInSession(sessionId, executionInfo);
      res.status(201).send();
    } else {
      res.status(403).send();
    }
  });
});

//I know, this endpoint it not restful... however, it is how it is. 
//If you have time: Rather return a execution object when posting a execution, make a put endpoint for execution
//and update a status or something similar
sessionRouter.post('/sessions/:id/execution/cancel/', keycloak.protect(), async (req, res) => {
  let sessionId = req.params.id;
  let session = await sessionManager.lookupSession(sessionId);

  if (!session)
  {
    res.status(404).send();
    return;
  }

  executionUnit.cancelExecution(sessionId);

  res.status(200).send();
});

//Long polling endpoint to get updates regarding the latest session execution
sessionRouter.get('/sessions/:id/execution/events/', keycloak.protect(), async (req, res) => {
  let sessionId = req.params.id;
  let session = await sessionManager.lookupSession(sessionId);
  let { since = -1 } = req.query;
  since = Number(since);

  let timeout = 30 * 1000 //Default -> 30 seconds
  let finish = new Date(new Date().getTime() + timeout);

  if (!session)
  {
    res.status(404).send();
    return;
  }

  //See if there are already logs
  let logs = executionUnit.getSessionLogsSince(sessionId, since);
  if (logs.length > 0)
  {
    res.status(200).send(logs);
    return; 
  }
  
  //Otherwise: do long polling
  let queue = new WaitQueue();
  const eventListener = (session) => {
    if (session == sessionId) {
      queue.push(session);
    }
  }
  executionUnit.on('newLog', eventListener);

  //Retry to find events till success or time is up
  while (Date.now() < finish && logs.length == 0)
  {
      let difference = finish - Date.now();
      //Wait the remaining time
      const promiseTimeout = new Promise((resolve, reject) => {
          setTimeout(resolve, difference, "timeout");
      });

      //Wait for the Timeout or the WaitQueue to finish
      let value = await Promise.any([promiseTimeout, queue.shift()]); 

      //Check if the timeout or the queue finished 
      if (value != "timeout")
      {
        //Wait 100ms to have the possibility to get concurrent logs
        //-> reduces number of packets transmitted and should not be noticeable for the user
        await delay(100);
        logs = executionUnit.getSessionLogsSince(sessionId, since);
      }
  }

  executionUnit.removeListener('newLog', eventListener);
  res.status(200).send(logs); 
});

// get the stats of a session
sessionRouter.get('/sessions/:id/stats/', keycloak.protect(), async (req, res) => {
  const sessionId = req.params.id;
  let session = await sessionManager.lookupSession(sessionId);

  if (!session)
  {
    res.status(404).send();
    return;
  }

  const maximumCPUUsage = executionUnit.getMaximumCPUUsage(sessionId);
  const maximumMemoryUsage = executionUnit.getMaximumMemoryUsage(sessionId);
  const maximumNumberPIDs = executionUnit.getMaximumNumberPids(sessionId);
  const networkUsage = executionUnit.getMaximumNetworkUsage(sessionId);
  const stationSizeDifferences = executionUnit.getStationImageSizeDifferences(sessionId)
  
  res.status(200).send({
    maximumCPUUsage,
    maximumMemoryUsage,
    maximumNumberPIDs,
    rx_bytes: networkUsage.rx_bytes,
    tx_bytes: networkUsage.tx_bytes,
    stationSizeDifferences
  })

})

//Long polling endpoint to get updates regarding the latest session execution
sessionRouter.get('/sessions/:id/results/', keycloak.protect(), async (req, res) => {
  let sessionId = req.params.id;
  

  let results = executionUnit.getSessionResults(sessionId);
  if (results == undefined)
  {
    res.status(400).send();  
  }

  res.status(200).send(results);
});


//Long polling endpoint to get updates regarding the latest session execution
sessionRouter.get('/sessions/:id/results/download', keycloak.protect(), async (req, res) => {
  let sessionId = req.params.id;
  let session = await sessionManager.lookupSession(sessionId);
  let path = req.query.path;

  if (!session || !path)
  {
    res.status(404).send();
    return;
  }

  let result = await executionUnit.extractFromSessionResults(sessionId, path);
  if (result == undefined || result.length == 0)
  {
    res.status(400).send();
    return;
  }

  try {
    let filename = req.query.path.split('/').pop(); 
    if (!filename)
    {
      filename = req.query.path.split('/') + ".tar";
    }
    //Write file as response
    res.writeHead(200, {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": "attachment; filename=" + filename
    });

    result.pipe(res).on('finish', () => 
    {
      result.cleanup();
    })
  } catch (e)
  {
    log.error(e);
    result.cleanup();
  }
});
module.exports = sessionRouter