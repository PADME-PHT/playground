
const { NoUniqueInstanceFoundError, NoSuitablePluginError } = require('./errors');
const primitiveTypes = require('../models/datatypes/primitiveDataTypes');
const complexTypes = require('../models/datatypes/complexDataTypes');
const GenerationResult = require('./models/generationResult');
const PluginManager = require('../../utils/plugin-manager');
const log = require("loglevel").getLogger("dataGenerator");
const DatasetTypes = require('./../models/dataset-types');
const { pickRandom } = require('../../utils/arrayUtils');
const DataTypes = require('./../models/datatypes');
const _ = require('lodash');

const GENERATED_INSTANCES = 10;

class DataGenerator
{
  //------------------ Properties ------------------
  #pluginLookup = {};

  //------------------ Constructor ------------------

  /**
   * @returns A singleton DataSourceProvisioner object
   */
  constructor() {
    //Ensure only one DataSourceProvisioner can be created
    if (DataGenerator._instance) {
      return DataGenerator._instance;
    }
    DataGenerator._instance = this;
    
    //Load the plugins
    let self = this;
    let plugins = new PluginManager(
      `${__dirname}/plugins`,
      (plugin, name, log) => self.#validatePlugin(self, plugin, name, log)
    ).loadPlugins();

    //Index Plugins
    this.#buildPluginIndex(plugins);
  }

  //------------------ internal methods ------------------
  
  /**
   * Validates that the provided plugins are valid and useable
   */
  #validatePlugin(self, plugin, name, log)
  {
    //Check each of the supported IRIs
    for (let i = 0; i < plugin.info.length; i++) {
      let iri = plugin.info[i];
      
      //Unknown IRI, plugin will be ignored
      if (!self.#iriIsComplexIri(iri) && !self.#iriIsCoreIri(iri))
      {
        log.warn(`The plugin ${name} has an invalid type ${iri} at info index ${i} (needs to be an primitive or complex data type iri)`);
        return false;
      } 
    }

    //Validate the methods
    if (!(typeof plugin.class.prototype.createInstance === "function"))
    {
      log.warn(`The plugin ${name} has no createInstance function`);
      return false;
    }

    return true;
  }

  /**
   * Build a plugin index to lookup plugins when they are required
   * @param {*} plugins List of loaded plugins
   */
  #buildPluginIndex(plugins)
  {
    for (let plugin of plugins)
    {
      for (let iri of plugin.info)
      {
        if (!this.#pluginLookup[iri])
        {
          this.#pluginLookup[iri] = [];
        }
        this.#pluginLookup[iri].push(plugin); 
      }
    }
  }

  /**
   * Returns if the given iri of a datatype is a complex datatype
   * @param {*} iri 
   * @returns 
   */
  #iriIsComplexIri(iri)
  {
    return _.find(complexTypes.enums, (type) => type.value.uri == iri) != undefined;
  }

  /**
   * Returns if the given iri of a datatype is a primitive datatype
   * @param {*} iri 
   * @returns 
   */
  #iriIsCoreIri(iri)
  {
    return _.find(primitiveTypes.enums, (type) => type.value == iri) != undefined;
  }

  /**
   * Cuts of parts at the end of the given value if the value is to long and length is given
   * @param {*} value 
   * @param {*} length 
   * @returns 
   */
  #truncateValue(value, length)
  {
    if (length && value.toString().length > length)
    {
      if (typeof value == 'number' || typeof value == 'bigint')
      {
        value = Number(value.toPrecision(length));
      } else if (typeof value == 'string')
      {
        value = value.substring(0, length);
      }
    }
    return value;
  }

  /**
   * @param {string} iri 
   * @returns a new instance for the plugin that can create the given iri or 
   */
  #getPluginForIri(iri)
  {
    let plugins = this.#pluginLookup[iri]; 
    if (plugins == undefined || plugins.length == 0)
    {
      throw new NoSuitablePluginError(`No suitable plugin for iri ${iri} was found`);
    }
    let plugin = this.#pluginLookup[iri][0];
    return new plugin.class();
  }

  /**
   * Creates an instance of the datatype for the given iri
   * @param {*} iri 
   * @param {*} length 
   * @returns 
   */
  async #createInstance(iri, length)
  {
    let value = await this.#getPluginForIri(iri).createInstance(iri, length);
    //Truncate if length is too much
    return this.#truncateValue(value, length);
  }

  /**
   * @param {*} array 
   * @param {*} subarray 
   * @returns Whether the given array contains the given subarray
   */
  #containsSubarray(array, subarray)
  {
    return array.some(
      r => r.length == subarray.length &&
          r.every((value, index) => subarray[index] == value)
    );
  }

  /**
   * Creates a combination of values for the given list of iris that does not yet 
   * exist in the provided list of existing values
   * @param {*} iris 
   * @param {*} lengths 
   * @param {*} existing 
   * @returns 
   */
  async #createPrimaryKey(columns, existing, dataset, table, generated)
  {
    let tries = GENERATED_INSTANCES * 2;
    for (let i = 0; i < tries; i++)
    {
      //Create a possible primary key instance
      let instance = [];
      for (let j = 0; j < columns.length; j++)
      {
        let created;
        if (!columns[j].referenceTo)
        {
          created = await this.#createInstance(columns[j].datatype.iri, columns[j].datatype.length);
        } else {
          created = this.#getReferenceInstance(columns[j], dataset, generated);
        }
        instance.push(created);
      }

      //Check if this instance already existed
      if (!this.#containsSubarray(existing, instance))
      {
        return instance;  
      }
    }
    throw new NoUniqueInstanceFoundError(
      `No unique instance could be generated for the columns ${columns.map(column => column.key).join(',')} in table ${table.key} after ${tries} tries.`
    );
  }

  /**
   * 
   * @param {} table The table to extract the column value from
   * @param {*} columnId The id of the column we are searching for
   * @param {*} existing 
   */
  #extractExistingValueForColumnId(table, columnId, existing)
  { 
    for (let column of table.columns)
    {
      if (column.id == columnId) {
        //Search Column for direct match
        return existing[column.key];
      } else if (column.dataTypeKind == DataTypes.Object)
      {
        //Proceed recursively
        let res = this.#extractExistingValueForColumnId(column.datatype, columnId, existing[column.key]);
        if (res) return res;
      } else if (column.dataTypeKind == DataTypes.List)
      {
        //List can be object or attribute
        if (column.datatype.dataTypeKind == DataTypes.Object)
        {
          let res = this.#extractExistingValueForColumnId(column.datatype, columnId, pickRandom(existing[column.key]));
          if (res) return res;
        } else if (column.datatype.id == columnId)
        {
          //If this is an attribute, then return one of the list elems
          return pickRandom(existing[column.key])
        }
      }
    }
    return undefined;
  }

  /**
   * Returns an already generated instance that fulfills the reference of the provided column
   * @param {*} column 
   * @param {*} dataset 
   * @param {*} generated 
   */
  #getReferenceInstance(column, dataset, generated)
  {
    //Get the columns for every table
    let columns = dataset.getFlattenedTableColumns();

    //Find the reference table
    let table = _.find(dataset.tables, (table) => _.find(columns[table.key], { id: column.referenceTo }));
    let targetColumn = _.find(columns[table.key], { id: column.referenceTo });

    let existing = generated.getResultForTable(table.key);
    //Select random element
    let reference = pickRandom(existing);
    return this.#extractExistingValueForColumnId(table, targetColumn.id, reference);
  }

  /**
   * 
   * @param {*} elem 
   * @param {*} dataset 
   * @param {*} generated 
   * @returns 
   */
  async #createListOfInstances(elem, dataset, generated)
  {
    if (elem.dataTypeKind == DataTypes.Attribute)
    {
      return [elem.datatype.value];
    } else if (elem.dataTypeKind == DataTypes.Object)
    {
      return await this.#createDataForTable(elem.datatype, dataset, generated, GENERATED_INSTANCES);
    } else {
      //Generate List recursively
      let list = [];
      for (let i = 0; i < GENERATED_INSTANCES; i++)
      {
        let recursive = await this.#createRecursiveInstance(
          elem.datatype.dataTypeKind, elem.datatype,
          dataset, generated
        );
        list.push(recursive);
      }
      return list;
    }
  }

  /**
   * Resolves an instance recursively by its datatype
   * @param {*} datatype 
   * @param {*} elem 
   * @param {*} dataset 
   * @param {*} generated 
   * @returns 
   */
  async #createRecursiveInstance(datatype, elem, dataset, generated)
  {
    switch (datatype)
    {
      case DataTypes.Object:
        //Generate one instance
        let instances = await this.#createDataForTable(elem, dataset, generated, 1)
        return await instances[0];
      case DataTypes.Atomic: 
        return await this.#createInstance(elem.datatype.iri, elem.datatype.length)
      case DataTypes.List:
        return await this.#createListOfInstances(elem, dataset, generated);
    }
  } 


 /**
  * in-place concatenate function (does nto need a new array for the result)
  * @param {} array 
  * @param {*} concatArray 
  */
  #concat(array, concatArray)
  {
    for (let elem of concatArray)
    {
      array.push(elem);  
    }
  }
  
  /**
   * Generates a object that is a instance of a table
   * @param {*} hasValue All columns with a predefined value
   * @param {*} nonAtomic All columns that have a non atomic data type
   * @param {*} primary All columns that are a primary key
   * @param {*} references All columns referencing other columns
   * @param {*} atomic All column with a atomic data type
   * @param {*} primaryKeys List of existing primary keys
   * @returns 
   */
  async #generateTableInstance(table, hasValue, nonAtomic, primary, references, atomic, primaryKeys, dataset, generated)
  {
    let instance = {};

    //First, create the primary key(s) (might have multiple that need to only be unique in combination)
    if (primary.length > 0)
    {
      let keys = await this.#createPrimaryKey(primary, primaryKeys, dataset, table, generated);
      keys.forEach((elem, i) => instance[primary[i].key] = elem);
      primaryKeys.push(keys);
    }
    
    //Create instances with value
    hasValue.forEach(column => {
      instance[column.key] = column.value;
    });

    //Create references
    references.forEach(column => {
      instance[column.key] = this.#getReferenceInstance(column, dataset, generated);
    });

    //Create all that have an atomic type with plugins
    for (let column of atomic)
    {
      instance[column.key] = await this.#createInstance(column.datatype.iri, column.datatype.length);
    }

    //Create recursive Elements if any
    for (let column of nonAtomic)
    {
      instance[column.key] = await this.#createRecursiveInstance(column.dataTypeKind, column.datatype, dataset, generated);
    }

    return instance;
  }

  /**
   * Creates data for the given table
   * @param {*} table The table to generate data for
   * @param {*} generated The existing generated data
   */
  async #createDataForTable(table, dataset, generated, numberOfInstances)
  {
    //The different columns to create (ones with an external reference are simply ignored)
    let hasValue = table.columns.filter(column => column.value != undefined);
    let references = table.columns.filter(column => column.referenceTo != undefined && !column.isUnique);
    let nonAtomic = table.columns.filter(column => column.dataTypeKind != DataTypes.Atomic && !hasValue.includes(column) && !references.includes(column));
    let atomic = table.columns.filter(column => column.dataTypeKind == DataTypes.Atomic && !hasValue.includes(column) && !references.includes(column));
    let primary = atomic.filter(column => column.isUnique && !hasValue.includes(column));
    let other = atomic.filter(column => !column.isUnique && !column.referenceTo);

    //If all columns have a value, generate only one instance (prevent duplicates)
    if (hasValue.length == table.columns.length)
    {
      numberOfInstances = 1;
    }

    let instances = [];
    let primaryKeys = [];
    for (let i = 0; i < numberOfInstances; i++)
    {
      let instance = await this.#generateTableInstance(
        table, hasValue, nonAtomic,
        primary, references, other,
        primaryKeys, dataset, generated
      );

      instances.push(instance);
    }
    return instances;
  }

  /**
   * Generates data for relational or object-oriented datasets
   * @param {*} result 
   * @param {*} dataset 
   */
  async #handleNoneMimeTypeDataset(result, dataset)
  {
    for (let table of dataset.getTablesSortedByTopology())
    {
      let instances = await this.#createDataForTable(table, dataset, result, GENERATED_INSTANCES);
      result.addGenerationResultForTable(table.key, instances);
    }
    log.info(`Data for dataset ${dataset.id} created`);
  }

  /**
   * Handles a dataset that has a specific MimeType
   * @param {*} result 
   * @param {*} dataset 
   */
  async #handleMimeTypeDataset(result, dataset)
  {
    let generated = [];
    for (let i = 0; i < GENERATED_INSTANCES; i++)
    {
      generated.push(await this.#createInstance(dataset.formatType));
    }
    result.addGenerationResultForMimeTypes(generated);
  }

  //------------------ public methods ------------------
  /**
   * Generates example data for the provided dataset
   * @param {Dataset} dataset The dataset to generate for
   * @returns {GenerationResult} the generated instances
   */
  async generateDataForDataset(dataset)
  {
    log.info(`Generating data for dataset ${dataset.id}`);
    let generated = new GenerationResult();

    //Generate data depending on dataset
    if (dataset.type.value == DatasetTypes.MimeType.value)
    {
      await this.#handleMimeTypeDataset(generated, dataset);
    } else {
      await this.#handleNoneMimeTypeDataset(generated, dataset);
    }

    return generated;
  }
}

module.exports = DataGenerator;