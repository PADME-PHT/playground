
const primitiveTypes = require('../../lib/models/datatypes/primitiveDataTypes');
const log = require("loglevel").getLogger("sequelizeCore");
const promiseRetry = require('promise-retry');
const { Sequelize} = require('sequelize');
const _ = require('lodash');

/**
 * @param {DataType} datatype The datatype of the column for which the sequelize Type should be returned
 */
const resolveSequelizeType = (datatype) => 
{
  switch (datatype.primitiveTypeIri)
  {
    case primitiveTypes.String.value:
      if (datatype.length != undefined)
      {
        return Sequelize.STRING(datatype.length);  
      }
      return Sequelize.STRING;
    case primitiveTypes.Boolean.value:
      return Sequelize.BOOLEAN;
    case primitiveTypes.UnsignedInt.value:
    case primitiveTypes.Int.value:
      return Sequelize.INTEGER;
    case primitiveTypes.Double.value:
      return Sequelize.DOUBLE;
    default:
      throw new Error(`Detected unknown primitive type with iri ${datatype.primitiveTypeIri} while setting up database`);
  }
}

/**
 * Creates the models that can be used to create tables and fill them with data
 * @param {*} sequelize 
 * @param {*} dataset 
 * @returns 
 */
const createModels = (sequelize, dataset) => 
{
  let modelLookup = {};

  //For each Table and corresponding column, create model
  for (let table of dataset.tables)
  {
    let tableModel = {}
    for (let column of table.columns)
    {
      let columnModel = {};
      columnModel["type"] = resolveSequelizeType(column.datatype);
      if (column.isUnique)
      {
        columnModel["primaryKey"] = true; 
      } else {
        columnModel["primaryKey"] = false; 
      }

      //Handle foreign key references
      if (column.referenceTo)
      {
        //First, find the other table
        let table = _.find(dataset.tables, (table) => _.find(table.columns, { id: column.referenceTo }));
        let targetColumn = _.find(table.columns, { id: column.referenceTo });

        columnModel["references"] = {
          model: table.key, 
          key: targetColumn.key
        }
      }

      tableModel[column.key] = columnModel;
    }

    //freezeTableName is needed to prevent sequelize from automatically pluralizing the table
    let model = sequelize.define(table.key, tableModel, { timestamps: false, freezeTableName: true});
    modelLookup[table.key] = model;
  }

  return modelLookup;
}

/**
 * Creates the tables in the db, retries till the db is available and can connect
 * @param {*} tables 
 */
const createTablesInDb = async (dataset, modelLookup, tables) => 
{
  let promiseRetryOptions = {
    retries: 20,
    minTimeout: 500,
    maxTimeout: 5000
  }

  await promiseRetry((retry, number) => 
  {
    log.info(`Creating tables for dataset ${dataset.key} - try number: ${number}`)
   
    //Try creating first Table
    return modelLookup[tables[0].key].sync({ force: true })
      .catch((e) => {
        //Connection error: e.g. database is starting up (accepts connections but not yet queries)
        if (e.name == 'SequelizeConnectionRefusedError' || e.name == 'SequelizeConnectionError')
        {
          retry();
        } else {
          throw e;
        }
      });
  }, promiseRetryOptions)

  //Create the rest of the tables
  for (let i = 1; i < tables.length;  i++)
  {
    //Process sequentially
    await modelLookup[tables[i].key].sync({ force: true });
  }
}

/**
 * First creates the sequelize models for the given dataset,
 * then uses the provided sequelize instance to create the tables in the db
 * @param {*} sequelize A sequelize instance with the correct parameters to access the database
 * @param {Dataset} dataset The dataset that the tables and models should be created for
 * @returns a lookup object with the table keys as key and the corresponding model as value
 */
const createModelsAndTables = async (sequelize, dataset) =>
{
  //Create the models
  let modelLookup = createModels(sequelize, dataset);

  //Get the topological sorting for the dataset in order to create the tables
  //And then create the tables according to this sorting
  await createTablesInDb(dataset, modelLookup, dataset.getTablesSortedByTopology());

  return modelLookup;
}

module.exports = createModelsAndTables;