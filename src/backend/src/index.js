const config = require("./config/index");
require("./utils/logging");
let log = require("loglevel").getLogger("server");

//This unfortunately has to be a async wrapper function...
//To use toplevel async we would need to switch to ES6 imports, which
//At this point would be a major hassle since e.g. the plugin import is 
//build around the CommonJS import structure.
//Therefore, this is the way to go for now.
const main = async () => 
{
  log.info(`Server starting in ${config.common.envIsProduction ? 'production': 'development'} environment`);

  //--------------- Initialize internal resources ----------------
  // This step could mostly also be done lazy, but here we favor request times over sever startup times)
  // Also: This displays errors (e.g. while loading plugins) at startup

  // Start cleanup in SessionManager
  log.info("Initializing internal resources");

  const SessionManager = require("./lib/session-manager");
  let manager = new SessionManager(); 
  manager.startCleanup();

  const DataSourceProvisioner = require('./lib/source-provisioner');
  let provisioner = new DataSourceProvisioner();

  //In production pull all images on startup, for dev this is only annoying
  if (config.common.envIsProduction)
  {
    await provisioner.pullPluginImages();
  }
  
  //Load generator plugins
  const DataGenerator = require('./lib/data-generator');
  new DataGenerator();
  
  //Init Execution unit
  const TaskExecutionUnit = require("./lib/task-execution-unit/");
  new TaskExecutionUnit();

  log.info("Initializing internal resources finished");

  //------------------ Configure App ------------------
  const expressMiddleware = require('./utils/logging').expressMiddleware;
  const indexRouter = require('./api/index');
  const express = require('express'); 
  const cors = require('cors');
  const http = require('http');
  const app = express()

  //Cors settings
  let origin = true; //Dev
  if (config.common.envIsProduction)
  {
    if (config.server.corsOrigin)
    {
      origin = config.server.corsOrigin;
    } else {
      origin = false;
      log.error("No cors setting CORS_ORIGIN in env variables, cors will be disabled"); 
    }
  }

  var corsOptions = {
    origin: origin
  }

  app.use(cors(corsOptions))

  //Add keycloak middleware
  const { keycloak } = require('./utils/keycloak');
  app.use(keycloak.middleware());
  
  //Further express settings
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(expressMiddleware);

  //Log all requests and their duration
  if (config.common.envIsProduction)
  {
    //Prod runs behind a proxy, needs to be told to express
    app.set( 'trust proxy', true );
  }

  //Routes
  app.use(indexRouter());

  // catch everything else with 404 and forward to error handler
  app.use(function(req, res, next) {
    res.status(404).send({ error: 'Not found' })
  });

  // error handler
  app.use(function (err, req, res, next) {
    let log = require("loglevel").getLogger("server");
    const config = require("./config/index");
    // set locals, only providing error in development
    log.error(err.message);
    res.locals.message = err.message;
    res.locals.error = config.common.envIsDevelopment ? err : {};
    res.status(err.status || 500).send({ error: err })
  });

  //--------------- Create Http Server ----------------
  let server = http.createServer(app);

  server.listen(config.server.port);
  server.on('error', onError);
  server.on('listening', onListening);

  //Handle login on server termination
  let terminate = (signal) => {
    let log = require("loglevel").getLogger("server");
    log.info(`${signal} signal received: closing HTTP server`)
    server.close(() => {
      log.info('HTTP server closed');
    }); 

    //Stop cleanup in SessionManager
    let manager = new SessionManager(); 
    manager.dispose();
  };
  process.on('SIGINT', () => terminate('SIGINT'));
  process.on('SIGTERM', () => terminate('SIGTERM'));

  /**
   * Event listener for HTTP server "error" event.
   */
  function onError(error) {
    if (error.syscall !== 'listen') {
      throw error;
    }

    var bind = typeof port === 'string'
      ? 'Pipe ' + port
      : 'Port ' + port;
    
    let log = require("loglevel").getLogger("server");
    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        log.error(bind + ' requires elevated privileges');
        process.exit(1);
      case 'EADDRINUSE':
        log.error(bind + ' is already in use');
        process.exit(1);
      default:
        log.error(error);
        throw error;
    }
  }

  /**
   * Event listener for HTTP server "listening" event.
   */
  function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
    let log = require("loglevel").getLogger("server");
    log.info('Listening on ' + bind);
  }
}

main().catch(e => {
  log.error("Something went wrong during app setup:");
  log.error(e);
});