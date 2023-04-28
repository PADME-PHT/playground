const log = require('loglevel'); 
const clc = require("cli-color");

//Overwrite the default log factory to change the format
var originalFactory = log.methodFactory;
log.methodFactory = function (methodName, logLevel, loggerName) {
    var rawMethod = originalFactory(methodName, logLevel, loggerName);

    return function (message) {
        //Format: YYYY-MM-DD hh:mm:ss
        let date = new Date(Date.now());
        let formattedDate = date.toISOString().replace('T', ' ').substring(0, 19);
        
        //First date, then component name, then log message
        let formattedMessage = `${formattedDate};${loggerName}${loggerName ? ';' : ''}${message}`;
        
        //use correct coloring depending on the method name
        switch (methodName)
        {
            case "warn" :
                rawMethod(clc.yellow(formattedMessage));
                break;
            case "error": 
                rawMethod(clc.red(formattedMessage));
                break;
            default:
                rawMethod(formattedMessage);
        }

        //In case of an error, print the object without format again
        //This will provide a stack strace that is otherwise lost
        if (message instanceof Error)
        {
            rawMethod(message);
        }
    };
};

const getActualRequestDurationInMilliseconds = start => {
    const NS_PER_SEC = 1e9; // convert to nanoseconds
    const NS_TO_MS = 1e6; // convert to milliseconds
    const diff = process.hrtime(start);
    return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS;
};

const expressMiddleware = function (req, res, next)
{
    let log = require("loglevel").getLogger("express-middleware");
    let method = req.method;
    let url = req.url;
    
    const start = process.hrtime();
    log.info(`${method}:${url}`);

    //Overwrite res end to get actual time and status code
    var end = res.end;
    res.end = function (chunk, encoding) {
        let status = res.statusCode;
        const durationInMilliseconds = getActualRequestDurationInMilliseconds(start);
        log.info(`${method}:${url} ${status} took ${durationInMilliseconds.toLocaleString()} ms`);
        res.end = end;
        res.end(chunk, encoding);
    };   
    next();
};

module.exports = {
    expressMiddleware
};
