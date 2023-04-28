const { createRandomUnsafePassword } = require('../../../../utils/randUtils');
const { ProvisionResult } = require("../../models/provision-result");
const sourceTypes = require('../../../models/source-types');
const log = require("loglevel").getLogger("MinIOPlugin");
const dockerUtil = require('../../../../utils/docker');
const PluginInfo = require('../../models/plugin-info');
const promiseRetry = require('promise-retry');
const MinIO = require('minio');
const _ = require('lodash');
const ProvisionEnv = require('../../models/provision-env');

const MINIO_PORT = 9000;
const NETWORK_ALIAS = "minio";
const IMAGE = "bitnami/minio:2022.9.1";
const BUCKET_NAME = "bucket";

class MinIOPlugin
{  
  //------------------ internal methods ------------------
  /**
   * Returns the environment variables to use for the database
   * @param {*} databaseName 
   * @returns 
   */
  #getDefaultEnvironmentVariables()
  {
    return {
      MINIO_ROOT_USER: "admin", //Important: Needs to be at least 5 characters, otherwise the container fails
      MINIO_ROOT_PASSWORD: createRandomUnsafePassword(8), //Same here: at least 8 characters
      MINIO_BROWSER: "off"
    };
  }

  /**
   * Returns a string representation for the provided environment variables
   * @param {*} envs 
   * @returns 
   */
  #getEnvsStrings(envs)
  {
    return _.keys(envs).map(key => `${key}=${envs[key]}`);
  }

  /**
    * Builds the ProvisionResult object that can be returned
    * @param {*} container 
    * @param {*} targetPort 
    * @param {*} envs 
    * @returns 
    */
  #createProvisionResult(container, targetPort, envs, bucketName)
  {
    let res = new ProvisionResult(container.id);
    res.addDataSourceHost(NETWORK_ALIAS);
    res.addDataSourcePort(targetPort);
    res.addDataSourcePassword(envs.MINIO_ROOT_PASSWORD); 
    res.addDataSourceUsername(envs.MINIO_ROOT_USER);
    res.addEnvVariable(new ProvisionEnv("BUCKET_NAME", bucketName, "The name of the MinIO bucket that contains the data"));
    return res;
  }
  
  /**
   * Creates a new minio client to communicate with minio
   * @param {*} container 
   */
  async #getMinIOClient(container, envs)
  {
    let targetPort = await dockerUtil.getTargetPort(container, MINIO_PORT);
    let hostName = dockerUtil.getDindHostname();

    let minioClient = new MinIO.Client({
      endPoint: hostName,
      port: Number(targetPort),
      useSSL: false,
      accessKey: envs.MINIO_ROOT_USER,
      secretKey: envs.MINIO_ROOT_PASSWORD
    });
    return minioClient;
  }

  /**
   * Waits for minio to become available
   * @param {*} client 
   */
  async #waitForMinio(client)
  {
    let promiseRetryOptions = {
      retries: 20,
      minTimeout: 1000, 
      maxTimeout: 5000,
    }
  
    await promiseRetry((retry, number) => 
    {
      log.info(`Waiting for minio to be ready - try number: ${number}`); 
      //Simply list available buckets, if this works minio is online
      return client.listBuckets().catch((e) =>
      {
        if (e.code == "ECONNREFUSED")
        {
          retry();  
        } else 
        {
          throw e;  
        }
      })
    }, promiseRetryOptions)
  }


  /**
   * Enables anonymous public access for the provided bucketName with the given client
   * @param {*} client 
   * @param {*} bucketName 
   */
  async #enablePublicAccess(client, bucketName)
  {
    //see https://docs.aws.amazon.com/AmazonS3/latest/userguide/example-bucket-policies.html#example-bucket-policies-use-case-2 
    let policy = {
      "Version": "2012-10-17", 
      "Statement": [
        {
            "Sid": "PublicRead",
            "Effect": "Allow",
            "Principal": "*",
            "Action": [
                "s3:GetObject",
                "s3:GetObjectVersion"
            ],
            "Resource": [
                `arn:aws:s3:::${bucketName}/*`
            ]
        }
      ]
    }
    //Set the policy
    await client.setBucketPolicy(bucketName, JSON.stringify(policy));
  }

  /**
   * Inserts the data into minio
   * @param {*} client 
   * @param {*} data 
   */
  async #insertData(dataset, client, data)
  {
    await this.#waitForMinio(client);

    //create bucket
    await client.makeBucket(BUCKET_NAME);

    //set policy to allow public access
    if (dataset.allowsAnonymousAccess)
    {
      await this.#enablePublicAccess(client, BUCKET_NAME);
    }

    //Fill with content
    for (let elem of data)
    {
      await client.putObject(BUCKET_NAME, elem.name, elem.content);
    }
    return BUCKET_NAME;
  }

  //------------------ public methods ------------------
  /**
   * @param {*} dataset the dataset to instantiate
   * @param {*} network id of the network the database should be part of
   * @param {} data The data to insert
   */
  async provisionDataSource(dataset, network, data) {

    log.info(`Creating MinIO instance for dataset ${dataset.title} with id ${dataset.id}`);
    let envs = this.#getDefaultEnvironmentVariables()
    let container = await dockerUtil.createContainerFromImageAndStart(IMAGE, this.#getEnvsStrings(envs), network, [MINIO_PORT], NETWORK_ALIAS);
    log.info(`MinIO instance for dataset ${dataset.title} with id ${dataset.id} created.`);

    log.info("Inserting data into MinIO..."); 
    let client = await this.#getMinIOClient(container, envs);
    let bucket = await this.#insertData(dataset, client, data.getGenerationResultForMimeTypes());
    log.info("...MinIO data inserted.");
    return this.#createProvisionResult(container, MINIO_PORT, envs, bucket);
  }

  /**
   * Gets called at server startup to lower request times
   */
  async pullImages()
  {   
    log.info(`Pulling all images for the MINIO Plugin`);
    await dockerUtil.pullImage(IMAGE)
    log.info(`MINIO Plugin images pulled`);
  }
}

module.exports.bucketName = BUCKET_NAME;
module.exports.info = [new PluginInfo(sourceTypes.MinIO, "22.9.1", "22.9.1")]
module.exports.class = MinIOPlugin;
module.exports.injectReference = false;
module.exports.enabled = true;