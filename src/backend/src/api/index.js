const express = require('express');
const router = express.Router();
const organizationController = require('./controllers/organizationsController');
const stationsController = require('./controllers/stationsController');
const datatypeController = require('./controllers/datatypeController');
const datasetController = require('./controllers/datasetController');
const sessionController = require('./controllers/sessionController');

module.exports = () => {
  
  router.get('/', function (req, res, next) {
    res.status(200).send('Welcome to the PADME Playground API');
  });

  //Other Endpoints
  router.use('/', organizationController);
  router.use('/', stationsController);
  router.use('/', datasetController);
  router.use('/', sessionController);
  router.use('/', datatypeController);

  return router;
};
