const log = require("loglevel").getLogger("organizationsController");
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

/**
 * Adds the stations for the organization when requested
 * @param {*} req 
 * @param {*} organizations
 */
const includeStations = async function(req, organizations)
{
  let includeStations = req.query.includeStations;

  if (includeStations)
  {
    let promises = organizations.map(async (orga) => {
      let stations = await queryEngine.getStations(orga.id);
      await includeDatasets(req, orga.id, stations);
      orga.setStations(stations);
      return Promise.resolve();
    }); 

    await Promise.all(promises);
  }
}

//------------------ public endpoints ------------------
orgRouter.get('/organizations/', keycloak.protect(), async (req, res) => {
  let result = await queryEngine.getOrganizations();

  //Include sub components when requested
  await includeStations(req, result);

  res.status(200).send(result);
});

orgRouter.get('/organizations/:id', keycloak.protect(), async (req, res) => {
  let id = req.params.id;
  let result = await queryEngine.getOrganization(id);
  if (result) {
    //Include sub components when requested
    await includeStations(req, [result]);
    res.status(200).send(result);
  } else {
    res.status(404).send({});
  } 
});

module.exports = orgRouter