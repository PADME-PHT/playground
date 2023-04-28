const log = require("loglevel").getLogger("datasetController");
const QueryEngine = require('./../../lib/query-engine');
const { keycloak } = require('./../../utils/keycloak');
const { Router } = require('express');

const datasetRouter = Router(); 
const queryEngine = new QueryEngine();


//------------------ public endpoints ------------------
datasetRouter.get('/organizations/:orgId/stations/:stationId/datasets', keycloak.protect(), async (req, res) => {
  let orgId = req.params.orgId;
  let stationId = req.params.stationId;
  let result = await queryEngine.getDatasets(orgId, stationId);
  res.status(200).send(result);
});

datasetRouter.get('/organizations/:orgId/stations/:stationId/datasets/:id', keycloak.protect(), async (req, res) => {
  let orgId = req.params.orgId;
  let stationId = req.params.stationId;
  let id = req.params.id;
  let result = await queryEngine.getDataset(orgId, stationId, id);
  if (result)
  {
    res.status(200).send(result);
  } else {
    res.status(404).send();
  }
});

module.exports = datasetRouter