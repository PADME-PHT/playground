const { getAgentOptions } = require('../../../dind-certs-client');
const log = require("loglevel").getLogger("dockerUtil");
const Docker = require('dockerode');
var tar = require('tar-stream');
var stream = require('stream');
const _ = require('lodash');

/**
 * Returns the Hostname of the dind container
 * @returns 
 */
 const getDindHostname = () => {
    return process.env.DOCKER_HOST;
 }

const getInstance = () => {

    const options = getAgentOptions();

    const docker = new Docker({
        protocol: 'https',
        host: getDindHostname(),
        port: process.env.DOCKER_PORT,
        ca: options.ca, 
        cert: options.cert,
        key: options.key
    });

    return docker;
}

const docker = getInstance();

/**
 * Gets the virtual size of an image. If image not exists, it throws an error.
 * @param {string} image The name of the image which size is returned
 */
const getImageSize = async (image) => {
    let foundImage = docker.getImage(image); 
    // https://docs.docker.com/engine/api/v1.37/#tag/Image/operation/ImageInspect
    inspectRes = await foundImage.inspect();
    // virtual size is the size of the images read-only layer
    return inspectRes.VirtualSize
}
/**
 * Creates a Container from the given image 
 * @param {string} image The name of the image that should be used
 * @param {string} name The name of the container
 * @param {[string]} env A list of key value pair to configure the environment variables
 * @param {string} network The name of the network to attach the container to
 * @param {objects | array[number]} portBindings An object or number array. The object should contain keys as numbers and values, specifying which port should be mapped to which e.g. {1234:1235}.
 * @param {string[] | string} aliases list of network aliases for the container, only valid when a valid network is given
 * The array only specifies target ports and docker will find corresponding ports to map to automatically
 * @returns A Promise that resolves in the corresponding container object
 */
const createNamedContainerFromImage = (image, name, env, network, portBindings, aliases) => 
{
    //Translate into an object
    if (Array.isArray(portBindings))
    {
        let newBindings = {};
        portBindings.forEach(binding => newBindings[binding] = "");
        portBindings = newBindings;
    }

    //Check alias
    if (!Array.isArray(aliases))
    {
        aliases = [aliases];
    }

    return new Promise(async (resolve, reject) => {

        //ensure image exists
        try {
            let foundImage = docker.getImage(image); 
            await foundImage.inspect();
        } catch (e)
        {
            //image does not exist, pull (or at least try)
            await pullImage(image);
        }

        //Build exposed ports object
        let exposedPorts = {};
        _.keys(portBindings).forEach(port => exposedPorts[port] = {});

        //Build port binding object
        let ports = {}
        _.keys(portBindings).forEach(port => {
            ports[port] = [{
                HostIp: "0.0.0.0",
                HostPort: portBindings[port].toString()
            }]
        });
        
        //Create container
        //Config for aliases
        let endpointConfig = {}
        endpointConfig[network] =
        {
            Aliases: aliases   
        }
        //Config for the rest
        let config = {
            Image: image, 
            name: name,
            Env: env, 
            ExposedPorts: exposedPorts,
            NetworkingConfig: {
                EndpointsConfig: endpointConfig
            },
            HostConfig: {
                NetworkMode: network, 
                PortBindings: ports
            }
        }; 
        var container = await docker.createContainer(config).catch(err => reject(err));
        resolve(container);
    }); 
}

/**
 * Creates a Container from the given image 
 * @param {string} image The name of the image that should be used
 * @param {[string]} env A list of key value pair to configure the environment variables
 * @param {string} network The name of the network to attach the container to
 * @param {objects | array[number]} portBindings An object or number array. The object should contain keys as numbers and values, specifying which port should be mapped to which e.g. {1234:1235}. 
 * @param {string[] | string} aliases list of network aliases for the container
 * The array only specifies target ports and docker will find corresponding ports to map to automatically
 * @returns A Promise that resolves in the corresponding container object
 */
const createContainerFromImage = async (image, env, network, portBindings, aliases) => 
{
   return createNamedContainerFromImage(image, undefined, env, network, portBindings, aliases);
}

/**
 * 
 * @param {string} image The name of the image that should be used 
 * @param {[string]} env A list of key value pair to configure the environment variables
 * @param {string} network The name of the network to attach the container to
 * @param {objects | array[number]} portBindings An object or number array. The object should contain keys as numbers and values, specifying which port should be mapped to which e.g. {1234:1235}. 
 * @param {string[] | string} aliases list of network aliases for the container 
 * The array only specifies target ports and docker will find corresponding ports to map to automatically
 * @returns a Container object referencing the created container
 */
const createContainerFromImageAndStart = async (image, env, network, portBindings, aliases) =>
{
    return new Promise(async (accept, reject) => {
        try {
            let container = await createContainerFromImage(image, env, network, portBindings, aliases);
            await container.start();
            accept(container);
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Lookups the binding target for a given binded port
 * @param {*} container The container object that you want to perform the lookup for
 * @param {*} bindedPort The port you want to find the binded counterpart for
 * @returns The port the bindedPort was binded to of undefined if no binded port could be found
 */
const getTargetPort = async(container, bindedPort) => 
{   
    let inspectRes = await container.inspect();
    let ports = inspectRes.NetworkSettings.Ports;
    let foundPort = _.find(_.keys(ports), (key) => key.startsWith(`${bindedPort}/`));
    if (foundPort)
    {
        let port = ports[foundPort]; 
        return port[0].HostPort;
    }
    return undefined;
}

/**
 * Creates a new docker network with the specified name
 * @param {*} name the name of the network
 */
const createNetwork = (name) => 
{
    return new Promise(async (resolve, reject) => {
        await docker.createNetwork({
            Name: name, 
            Driver: "bridge", 
            EnableIPv6: false
        }).catch(err => reject(err));
        resolve();
    });
}

/**
 * Removes the given docker networks by its id
 * @param {*} networkId 
 * @returns 
 */
const removeNetworkById = async (networkId) => 
{
    let network = docker.getNetwork(networkId);
    return await network.remove();
}

/**
 * Pipes the containers log files to the given logger
 * @param {*} container Container object e.g. from the createContainerFromImage method
 * @param {function} logger Function that accepts a string that should be logged
 * @param {function} errLogger Function that accepts a string that should be logged as error
 */
const writeContainerLogsToLogger = (container, logger, errLogger) =>
{
    //Code from: https://github.com/apocas/dockerode/blob/master/examples/logs.js
    //create a single stream for stdin and stdout
    var logStream = new stream.PassThrough();
    var errStream = new stream.PassThrough();

    logStream.on('data', function (chunk) {
        //Remove tailing newlines and spaces
        var content = chunk.toString('utf8'); 
        logger(content.trim());
    });

    errStream.on('data', function (chunk) {
        //Remove tailing newlines and spaces
        var content = chunk.toString('utf8'); 
        errLogger(content.trim());
    });

    container.logs({ follow: true, stdout: true, stderr: true }, function(err, stream) {
        if (err) {
            logStream.end();
            errStream.end();
            errLogger(err.message);
            return;
        }

        container.modem.demuxStream(stream, logStream, errStream);
        stream.on('end', function(){
            logStream.end();
            errStream.end();
            stream.destroy();
        });
    });
}

/**
 * Checks whether the given path exists in the container and otherwise creates it
 * @param {*} container the container were the path should be ensured
 * @param {*} pathToEnsure the path to ensure
 * @returns a Promise
 */
const ensurePathExistsInContainer = (container, pathToEnsure) => 
{
    //here error means the path does not exist
    return container.infoArchive({ path: pathToEnsure })
        .catch(_ => {
            log.info(`Path ${pathToEnsure} does not exists in container, creating...`);

            //Create Archive with path that should be ensured
            var tarStream = tar.pack();
            tarStream.entry({ name: pathToEnsure, type: 'directory' });
            tarStream.finalize(); 

            //Put the archive containing the folder into the root
            return container.putArchive(tarStream, { path: '/' })
                .then(_ => 
                {
                    log.info("...successfully created path");
                    return Promise.resolve();
                })
        });
}

/**
 * Extracts the archive at the provided path from the given container
 * @param {*} container 
 * @param {*} path 
 * @returns a Promise
 */
const extractArchive = async (container, extractPath) => 
{
    return container.getArchive({ path: extractPath })
        .then(archiveStream => {
            try {
                //Problem: the last folder in extractPath is a prefix for all files
                // => Remove this prefix
                var extract = tar.extract();
                var pack = tar.pack();

                extract.on('entry', function (header, stream, next) {
                    // remove last folder in FLDataPath as Prefix from all files
                    var split = header.name.split("/");
                    header.name = split.slice(1, split.length).join("/");

                    if (header.name != "")
                    {
                        // write the new entry to the pack stream
                        stream.pipe(pack.entry(header, next));
                    } else
                    {
                        //Auto drain stream
                        stream.on('end', function() {
                            next() // ready for next entry
                        })
                        stream.resume();
                    }
                });
                
                extract.on('finish', function () {
                    // all entries done - lets finalize it
                    pack.finalize();
                });

                // pipe the old tarball to the extractor
                archiveStream.pipe(extract);

                //Return new tar stream
                return Promise.resolve(pack);
            } catch (err)
            {
                return Promise.reject(err);
            }
        });
}

/**
 * Removes the given container and kills it if it is still running
 * @param {*} container 
 */
const removeContainer = async (container) => 
{
    if (container != null)
    {
        return await container.remove({ force: true });
    }
    return Promise.resolve();
}

/**
 * Removes (forcibly) the container with the given name
 * @param {string} containerId
 * @returns 
 */
const removeContainerById = async (containerId) => 
{
    let container = docker.getContainer(containerId);
    return await container.remove({ force: true });
}

/**
 * Removes an image with the given name
 * @param {*} imageName The name of the image that should be removed
 * @returns a successful promise if removal worked and a rejected promise when the image did not exist
 */
const removeImage = async (imageName) => {
    let image = await docker.getImage(imageName);
    if (image) {
       return await image.remove();
    } else
    {
        return Promise.reject();    
    }
}

/**
 * Pulls the provided docker image async
 * @param {string} imageName string of the image, can include a tag
 * @param {object} auth authentication for private registries, see https://github.com/apocas/dockerode and 'docker pull' on the objects structure
 */
const pullImage = async (imageName, auth) => 
{
    return new Promise((accept, reject) => 
    {
        docker.pull(imageName, { 'authconfig': auth }, function (err, stream)
        {
            if (err)
            {
                log.error(err);
                reject(err);
                return;
            }
            //Follow the progress
            docker.modem.followProgress(stream, onFinished, onProgress);

            function onFinished(err) {
                if (err) {
                    log.error(err);
                    reject(err);
                    return;
                }
                accept();
            }
            function onProgress(event) {
                log.debug(event.status);
            }
        });
    })   
}

const ensureContainerWithNameDoesNotExist = async (name) =>
{
    let container = docker.getContainer(name); 

    try {
        await container.remove({ force: true });
    // eslint-disable-next-line no-empty
    } catch { }

    return Promise.resolve();
}

/**
 * Builds a image from the given tar archive and returns the logs as output
 * @param {*} archive 
 * @param {*} imageName
 * @param {function} logFunction a function that accepts a string and is called whenever there is progress while building the image 
 */
const buildImageFromTarArchive = async (archive, imageName, logFunction) => {
    await new Promise((resolve, reject) => {
        docker.buildImage(archive, { t: imageName }, function (error, progress) {
            if (error) return reject(error);
            docker.modem.followProgress(progress, function onFinished(err) {
                if (error) return reject(error)
                resolve();
            }, function onProgress(output) {
                if (logFunction && output.stream)
                {
                    logFunction(output.stream.trim());
                } else if (output.error)
                {
                    reject(output.error);
                }
            });
        });
    });  
}

module.exports = {
    ensureContainerWithNameDoesNotExist,
    createContainerFromImageAndStart,
    createNamedContainerFromImage,
    ensurePathExistsInContainer,
    writeContainerLogsToLogger,
    buildImageFromTarArchive, 
    createContainerFromImage,
    removeContainerById,
    removeNetworkById,
    getDindHostname,
    removeContainer,  
    extractArchive,
    getTargetPort,
    createNetwork,
    removeImage,
    pullImage,
    getImageSize,
    instance : docker,
};