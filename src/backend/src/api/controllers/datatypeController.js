const log = require("loglevel").getLogger("datasetController");
const { Router } = require('express');

const datatypeController = Router();

//------------------ public endpoints ------------------
datatypeController.get('/datatype/*', async (req, res) => {
  //Simply redirect to the docs
  res.redirect("https://docs.padme-analytics.de/en/how-to/playground#datatypes")
});

module.exports = datatypeController