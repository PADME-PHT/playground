const log = require("loglevel").getLogger("stationsController");
const QueryEngine = require('./../../lib/query-engine');
const { keycloak } = require('./../../utils/keycloak');
const { Router } = require('express');

const orgRouter = Router(); 
const queryEngine = new QueryEngine();

//------------------ internal methods ------------------

/**
 * Adds the datasets for the stations when requested
 * @param {*} req 
 * @param {*} orgaId 
 * @param {*} stations 
 */
const includeDatasets = async function(req, orgaId, stations)
{
  let includeDatasets = req.query.includeDatasets;

  if (includeDatasets)
  {
    let promises = stations.map(async (station) => {
      let datasets = await queryEngine.getDatasets(orgaId, station.id, metadataOnly = true);
      station.setDatasets(datasets);
      return Promise.resolve();
    }); 

    await Promise.all(promises);
  }
}

//------------------ public endpoints ------------------
orgRouter.get('/organizations/:id/stations', keycloak.protect(), async (req, res) => {
  let orgaId = req.params.id;
  let result = await queryEngine.getStations(orgaId);

  //Include sub components when requested
  await includeDatasets(req, orgaId, result); 

  res.status(200).send(result);
});

orgRouter.get('/organizations/:id/stations/:stationId', keycloak.protect(), async (req, res) => {
  let orgaId = req.params.id;
  let stationId = req.params.stationId;
  let result = await queryEngine.getStation(orgaId, stationId);
  if (result)
  {
    //Include sub components when requested
    await includeDatasets(req, orgaId, result); 
    res.status(200).send(result);
  } else {
    res.status(404).send({});
  }
});

module.exports = orgRouter