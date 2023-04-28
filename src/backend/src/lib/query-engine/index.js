const { removePrefixFromValue, removeAllPrefixesFromValue, concatToPrefix } = require('./../../utils/prefixUtils');
const PrimitiveTypes = require('../models/datatypes/primitiveDataTypes');
const ComplexTypes = require('../models/datatypes/complexDataTypes');
const SparqlClient = require('./../../utils/sparql-client/index');
const AtomicDataType = require('../models/atomic-datatype');
const DatasetType = require('./../models/dataset-types');
const Organization = require('./../models/organization');
const ListDatatype = require('../models/list-datatype');
const log = require("loglevel").getLogger("queryEngine");
const sourceTypes = require('./../models/source-types');
const Station = require('./../models/station');
const Tabular = require('./../models/tabular');
const Dataset = require('./../models/dataset');
const Column = require('./../models/column');
const Prefix = require('./prefix');
const _ = require('lodash');
class QueryEngine {
  //------------------ Constructor ------------------

  /**
   * 
   * @returns A singleton QueryEngine object
   */
  constructor()
  {
    //Ensure only one JobManager can be created
    if (QueryEngine._instance) {
        return QueryEngine._instance;
    }
    QueryEngine._instance = this;
    
    this.invertedSourceTypes = _.invert(sourceTypes);
  }

  //------------------ internal methods ------------------
  
  /**
   * Builds a string in the SPARQL style to contain the prefixes
   * @param {*} prefixes 
   */
  #buildPrefixes(prefixes)
  {
    let res = "";
    //If defined and supports forEach
    if (prefixes && !!prefixes.forEach)
    {
      prefixes.forEach(x => {
        res += `PREFIX ${x.key}: ${x.value}\n`
      });
    }
    return res; 
  }

  /**
   * Returns the IRI for the primitive type for the given datatype
   * @param {*} dataTypeIRI 
   */
  #getPrimitiveTypeForDataTypeIRI(column, dataTypeIRI)
  {
    let values = PrimitiveTypes.enums.map(key => key.value);
    //Check if it is a primitive type
    if (_.find(values, val => val == dataTypeIRI))
    {
      return dataTypeIRI;  
    }

    //Check if it is a complex type
    let type = this.#findComplexTypeForIri(column, dataTypeIRI);
    //Return primitive Type
    return type.value.primitiveType.value;
  }

  /**
   * Tries to resolve the primitive type for the IRI, throws an exception if the type is not valid
   * @param {*} dataTypeIRI 
   * @returns The ComplexType if one was found
   */
  #findComplexTypeForIri(column, dataTypeIRI)
  {
    let type = _.find(ComplexTypes.enums, (key) => key.value.uri == dataTypeIRI); 
    if (!type)
    {
      log.warn(`${column} had an unsupported datatype with iri ${dataTypeIRI}`)
      throw new Error(`${column} had an unsupported datatype with iri ${dataTypeIRI}`);  
    }
    return type;
  }

  /**
   * Creates a new Datatype object that can be used
   * @param {*} iri 
   * @param {*} length 
   * @returns 
   */
  #createDataTypeInstance(columnKey, iri, length)
  {
    return new AtomicDataType(
      iri,
      removeAllPrefixesFromValue([Prefix.datatype, Prefix.xsd, Prefix.fhir], iri),
      this.#getPrimitiveTypeForDataTypeIRI(columnKey, iri),
      length
    );
  }

  /**
   * Creates a new Column object that can be used
   * @param {*} iri 
   * @param {*} length 
   * @returns 
   */
  #createColumnInstance(id, key, datatype, value, primary, foreign, external)
  {
    return new Column(
      removeAllPrefixesFromValue([Prefix.column, Prefix.attribute], id),
      key,
      datatype,
      value,
      primary,
      removeAllPrefixesFromValue([Prefix.column, Prefix.attribute], foreign), 
      removeAllPrefixesFromValue([Prefix.dataset], external)
    )
  }

  /**
   * Recursively resolves the given datatype type
   * @param {*} columnKey 
   * @param {*} datatype 
   * @returns 
   */
  async #resolveDatatypeWithRecursion(columnKey, datatype, datatypeId)
  {
    if(!datatype)
    {
      throw new Error(`Column with key ${columnKey} has no datatype`);
    }

    switch (datatype)
    {
      case concatToPrefix(Prefix.pht, "AttributeObjectDataInterfaceShape"):
        //Result is a tabular/object without a key
        let id = removePrefixFromValue(Prefix.object, datatypeId)
        let res = new Tabular(id);
        let columns = await this.#getColumnShapesForObjectShape(id);
        res.setColumns(columns);
        return res;
      case concatToPrefix(Prefix.pht, "DataInterfaceShapeListDatatype"):
        //Attribute is a list of something, resolve the list
        return await this.#getListDatatype(removePrefixFromValue(Prefix.datatype, datatypeId));
      default:
        throw new Error(`Column with key ${columnKey} has unknown datatype ${datatype}`);
    }
  }

  /**
   * Resolves the list datatype
   * @param {*} listId 
   */
  async #getListDatatype(listId)
  {
    let queryResult = await this.select(
      [Prefix.pht, Prefix.datatype], 
      `SELECT ?id ?datatype ?datatypeIRI ?dataTypeLength WHERE
      {
        datatype:${listId} pht:listDatatypeShapeContainsDatatype ?id.
        ?id a ?datatype . #Could be attribute, object, atomic

        #Check for atomic type
        OPTIONAL
        {
          ?id a pht:DataInterfaceShapeAtomicDatatype .
          ?id pht:hasDatatype ?datatypeIRI .
          OPTIONAL { ?datatypeId pht:atomicDataTypeLength ?dataTypeLength . }
        }
      }`
    )
    
    //Should yield exactly one element
    if (queryResult.length != 1) throw new Error(`list with id ${listId} had multiple datatypes`) 

    //Check the different possible types, first atomic, then attribute and last use recursion
    let result = queryResult[0];
    let resolvedDatatype = undefined;
    switch (result.datatype.value)
    {
      case concatToPrefix(Prefix.pht, "DataInterfaceShapeAtomicDatatype"):
        resolvedDatatype = this.#createDataTypeInstance(listId, result.datatypeIRI.value, result.dataTypeLength?.value)
        break; 
      case concatToPrefix(Prefix.pht, "AttributeInterfaceShape"):
        resolvedDatatype = await this.#getAttributeShape(removePrefixFromValue(Prefix.attribute, result.id.value));
        break;
      default:
        resolvedDatatype = await this.#resolveDatatypeWithRecursion(listId, result.datatype.value, result.id.value);
        break;
    }
    //Return a list as a result
    return new ListDatatype(listId, resolvedDatatype);
  }  
  
  /**
   * Resolve the attribute with the given id, including the datatype
   * @param {*} attributeShapeId 
   * @returns 
   */
  async #getAttributeShape(attributeShapeId)
  {
    let queryResult = await this.select(
      [Prefix.attribute, Prefix.pht], 
      `SELECT ?key ?value ?externalRef ?datatypeIRI ?dataTypeLength ?unique ?reference ?datatypeId ?datatypeType WHERE
      {
        OPTIONAL { attribute:${attributeShapeId} pht:dataInterfaceShapeHasKey ?key . }
        
        #Multiple possibilities, might have a value, a reference to another dataset, a atomic datatype or a recursive datatype
        OPTIONAL { attribute:${attributeShapeId} pht:attributeHasValue ?value . }
        OPTIONAL { attribute:${attributeShapeId} pht:associatedDataSet ?externalRef . }
        OPTIONAL { 
          attribute:${attributeShapeId} pht:shapeHasDatatype ?datatypeId .
          ?datatypeId a pht:DataInterfaceShapeAtomicDatatype;
          pht:hasDatatype ?datatypeIRI .

          #Datatype can have length
          OPTIONAL {?datatypeId pht:atomicDataTypeLength ?dataTypeLength . }
        }
        OPTIONAL { 
          attribute:${attributeShapeId} pht:shapeHasDatatype ?datatypeId . 
          ?datatypeId a ?datatypeType .
        }
        OPTIONAL { attribute:${attributeShapeId} pht:attributeIsUnique ?unique . }
        OPTIONAL { attribute:${attributeShapeId} pht:shapeReferences ?reference . }
      }`
    )

    if (queryResult.length != 1) {
      throw new Error(`Attribute shape with id ${attributeShapeId} not found. Expected to find 1 attribute, found ${queryResult.length}`);
    }
    
    let result = queryResult[0];
    let datatype = undefined;
    
    //Create a column with the correct data type
    if (result.datatypeIRI) {
      //Datatype is a simple atomic type, create DataType object
      datatype = this.#createDataTypeInstance(
        result.key?.value, result.datatypeIRI.value, result.dataTypeLength?.value
      )
    } else if (!result.value && !result.reference && !result.externalRef)
    {
      //No atomic data type and no value and internal or external reference -> Resolve recursively
      datatype = await this.#resolveDatatypeWithRecursion(
        result.key?.value, result.datatypeType?.value, result.datatypeId.value
      );
    }
  
    //Return new Column instance. If none of the cases above match, the value property will be set
    return this.#createColumnInstance(
      attributeShapeId, result.key?.value, datatype, result.value?.value,
      result.unique?.value, result.reference?.value, result.externalRef?.value
    );
  }

  /**
   * Resolves the columns/attributes for a object table
   * @param {*} tabularId 
   * @returns 
   */
  async #getColumnShapesForObjectShape(tabularId)
  {
    let queryResult = await this.select(
      [Prefix.object, Prefix.pht],
      `SELECT ?id WHERE
      {
        object:${tabularId} a pht:AttributeObjectDataInterfaceShape; 
        pht:consistsOfColumnShapes ?id .
      }`
    );

    //Check Query result in parallel
    let promises = queryResult.map((column) => this.#getAttributeShape(removePrefixFromValue(Prefix.attribute, column.id.value))); 
    return await Promise.all(promises);
  }
  
  /**
   * Resolves the columns for a relational table
   * @param {*} tabularId 
   * @returns 
   */
  async #getColumnShapesForRelationalShape(tabularId)
  {
    let queryResult = await this.select(
      [Prefix.pht, Prefix.rdf, Prefix.tabular],
      `SELECT ?id ?key ?unique ?foreign ?datatypeIRI ?dataTypeLength WHERE 
      { 
        tabular:${tabularId} rdf:type pht:TabularSQLDataInterfaceShape;
        pht:consistsOfColumnShapes ?id. 
        
        ?id pht:dataInterfaceShapeHasKey ?key;
        pht:shapeHasDatatype ?datatype .

        ?datatype a pht:DataInterfaceShapeAtomicDatatype;
        pht:hasDatatype ?datatypeIRI .

        OPTIONAL {?id pht:attributeIsUnique ?unique . }
        OPTIONAL {?id pht:shapeReferences ?foreign . }
        OPTIONAL {?datatype pht:atomicDataTypeLength ?dataTypeLength . }
      }`
    );

    let columns = []; 
    for (let column of queryResult)
    {
      let datatype = this.#createDataTypeInstance(column.key.value, column.datatypeIRI.value, column.dataTypeLength?.value)
      columns.push(this.#createColumnInstance(
        column.id.value, column.key.value, datatype, undefined, column.unique?.value, column.foreign?.value, undefined
      ));
    }

    return columns;
  }

  /**
  * @param {string} tabularId the identifier of the tabular shape
  * @returns {Column[]} a list of available column shapes at the table
  */
  async #getColumShapesForTabularShape(tabularId, tabularType)
  {
    if (tabularType == concatToPrefix(Prefix.pht, "TabularSQLDataInterfaceShape"))
    {
      return this.#getColumnShapesForRelationalShape(tabularId);
    } else {
      return this.#getColumnShapesForObjectShape(tabularId);
    }    
  }

  /**
  * @param {string} datasetID the identifier of the dataset
  * @returns {Tabular[]} a list of available tabular shapes at the dataset
  */
  async #getTabularShapesForDb(datasetID)
  {
    let queryResult = await this.select(
      [Prefix.pht, Prefix.rdf, Prefix.dataset],
      `SELECT ?id ?key ?type WHERE 
      { 
        dataset:${datasetID} rdf:type pht:Dataset; 
        pht:accessThroughInterface [
          pht:hasInterfaceShape [
            pht:consistsOfTabularShapes ?id
          ]
        ].
        
        ?id pht:dataInterfaceShapeHasKey ?key; 
        a ?type .
      }`
    );

    let tables = [];
    //Dictionary for looking up the type of a table (needed later)
    let typeLookup = {};
    for (let table of queryResult)
    {
      let id = removeAllPrefixesFromValue([Prefix.tabular, Prefix.object], table.id.value);
      typeLookup[id] = table.type.value;
      tables.push(new Tabular(
        id,
        table.key.value
      ));      
    }

    //Do everything in parallel
    let promises = tables.map(async (table) => {
      let columns = await this.#getColumShapesForTabularShape(table.id, typeLookup[table.id]);
      table.setColumns(columns);
      return Promise.resolve();
    });

    await Promise.all(promises);

    return tables;
  }

  /**
   * @param {string} sourceTypeIRI the source types IRI
   * @returns a readable sourceType name from the IRI
   */
  #getSourceTypeFromIRI(sourceTypeIRI)
  {
    let res = this.invertedSourceTypes[sourceTypeIRI];
    return res ? res : sourceTypeIRI;
  }

  /**
   * Returns the type of dataset from the interface shape type
   * @param {*} interfaceShapeType 
   */
  #resolveDatasetType(interfaceFormat, interfaceShapeType)
  {
    if (interfaceFormat)
    {
      return DatasetType.MimeType;
    }

    switch (interfaceShapeType)
    {
      case concatToPrefix(Prefix.pht, "RelationalSQLDataInterfaceShape"):
        return DatasetType.Relational;
      case concatToPrefix(Prefix.pht, "AttributeObjectCollectionInterfaceShape"):
        return DatasetType.ObjectCollection;
      default:
        throw new Error("Unknown dataset type");
    }
  }
  //------------------ public methods ------------------

  /**
   * Performs a SELECT at the given sparql endpoint with the given prefix and query
   * @param {Enum[]} prefix collections of prefix values from the internal prefix enum
   * @param {string} query the query that should be performed
   */
  async select(prefixes, query)
  {
    let prefix = this.#buildPrefixes(prefixes);
    let sparqlQuery = `${prefix} \n ${query}`;
    return await new SparqlClient().select(sparqlQuery);
  }
  
  /**
   * @returns {Organization[]} a list of available Organizations
   */
  async getOrganizations()
  {
    let queryResult = await this.select(
      [Prefix.foaf, Prefix.rdf],
      `SELECT ?id ?title WHERE 
      { 
        ?id rdf:type foaf:Organization;
        foaf:name ?title.
      }`
    );

    let result = []; 
    //Transform to model
    for (let orga of queryResult)
    {
      result.push(new Organization(
        removePrefixFromValue(Prefix.orga, orga.id.value),
        orga.title.value)
      );
    }

    return result;
  }

  /**
  * @param {string} id the identifier of the station
  * @returns {Organization | undefined} a specific organization with the provided id
  */
  async getOrganization(id)
  {
    let queryResult = await this.select(
      [Prefix.foaf, Prefix.rdf, Prefix.orga],
      `SELECT ?title WHERE
      { 
        orga:${id} rdf:type foaf:Organization;
        foaf:name ?title.
      }`
    );
  
    //Transform to model
    if (queryResult.length > 0)
    {
      return new Organization(
        id,
        queryResult[0].title.value
      );
    } else {
      return undefined;
    } 
  }

  /**
   * @param {string} orgaId the identifier of the stations organization
   * @returns {Station[]} a list of available Station
   */
  async getStations(orgaId)
  {
    let queryResult = await this.select(
      [Prefix.pht, Prefix.rdf, Prefix.orga],
      `SELECT ?id ?title ?description WHERE 
      { 
        ?id rdf:type pht:Station; 
        pht:userOwnedHasTitle ?title; 
        pht:userOwnedHasDescription ?description;
        pht:responsibleOrganization orga:${orgaId}.
      }`
    );

    //Transform to model
    let result = []; 
    for (let station of queryResult)
    {
      result.push(new Station(
        removePrefixFromValue(Prefix.station, station.id.value),
        station.title.value,
        station.description.value
      ));
    }
    return result;
  }

  /**
   * @param {string} orgaId the identifier of the stations organization
   * @param {string} stationId the identifier of the station
   * @returns {Station | undefined} The station when a station with this id exists
   */
  async getStation(orgaId, stationId)
  {
    let queryResult = await this.select(
      [Prefix.pht, Prefix.rdf, Prefix.station, Prefix.orga],
      `SELECT ?title ?description WHERE 
      { 
        station:${stationId} rdf:type pht:Station; 
        pht:userOwnedHasTitle ?title; 
        pht:userOwnedHasDescription ?description;
        pht:responsibleOrganization orga:${orgaId}.
      }`
    );
  
    //Transform to model
    if (queryResult.length > 0)
    {
      return new Station(
        stationId,
        queryResult[0].title.value,
        queryResult[0].description.value
      );
    } else {
      return undefined;
    } 
  }
  
  /**
   * @param {string} orgaId the identifier of the stations organization
   * @param {string} stationId the identifier of the station
   * @param {boolean} metadataOnly whether the dataset should only contain meta information and no information about its structure
   * @returns {Dataset[]} a list of available Datasets
   */
   async getDatasets(orgaId, stationId, metadataOnly = false) {
    let queryResult = await this.select(
      [
        Prefix.pht, Prefix.orga, Prefix.station,
        Prefix.rdf, Prefix.dcat
      ],
      `SELECT ?id ?title ?desc ?key ?interfaceT ?interfaceFormat ?version ?interfaceShT ?anonymous WHERE 
    { 
      station:${stationId} rdf:type pht:Station;
      pht:responsibleOrganization orga:${orgaId};
      pht:hasDataSet ?id .
      
      ?id rdf:type pht:Dataset; 
      dcat:title ?title; 
      dcat:description ?desc;
      pht:accessThroughInterface ?interfaceID .

      ?interfaceID rdf:type ?interfaceT;

      #Interface might have a format ...
      OPTIONAL { ?interfaceID pht:interfaceHasFormat ?interfaceFormat . }

      #... or a shape
      OPTIONAL {
        ?interfaceID pht:hasInterfaceShape ?interfaceSh .
        ?interfaceSh a ?interfaceShT .

        OPTIONAL {?interfaceSh pht:dataInterfaceShapeHasKey ?key . }
      }
      OPTIONAL { ?interfaceID pht:dataInterfaceVersion ?version . } .

      #interface can allow anonymous access
      OPTIONAL { ?interfaceID pht:interfaceAllowsAnonymousAccess ?anonymous . } .
    }`
    );

    let datasets = [];
    //Transform to model
    for (let dataset of queryResult) {
      
      try {
        let instance = new Dataset(
          removePrefixFromValue(Prefix.dataset, dataset.id.value),
          this.#resolveDatasetType(dataset.interfaceFormat?.value, dataset.interfaceShT?.value),
          dataset.title.value,
          dataset.desc.value,
          dataset.key?.value,
          this.#getSourceTypeFromIRI(dataset.interfaceT.value),
          dataset.interfaceT.value,
          dataset.version.value, 
          dataset.interfaceFormat?.value, 
          dataset.anonymous?.value
        ); 
        datasets.push(instance);
      } catch (e)
      {
        log.warn(`Dataset ${dataset.id} could not be loaded, ignoring dataset`);
      }
    }
    
    //Unfortunately: we can realize that a dataset cannot be processed later on
    //E.g. it uses unsupported atomic types
    //Therefore, we load everything, to only return datasets that are processable
    //But, if only the metadata should be displayed, we do not update the tables

    //Do everything in parallel
    let invalid = [];
    let promises = datasets.map(async (dataset) => 
    {
      try {
        if (dataset.type.value != DatasetType.MimeType.value)
        {
          let tables = await this.#getTabularShapesForDb(dataset.id);
          //Set tables only when they are requested
          if (!metadataOnly)
          {
            dataset.setTabular(tables);
          }
        } else 
        {
          //See if the specified type is valid
          this.#findComplexTypeForIri(dataset.title, dataset.formatType);
        }
      } catch (e)
      {
        log.error(e);
        log.warn(`Dataset ${dataset.id} could not be loaded, ignoring dataset`);
        //Remove from the lists of datasets
        invalid.push(dataset);
      }
      return Promise.resolve();
    }); 
     
    await Promise.all(promises);
    
    //Remove all invalid sets
    for (let dataset of invalid)
    {
      datasets.splice(datasets.indexOf(dataset), 1);
    }
    return datasets;
   }
  
  /**
   * @param {string} orgaId the identifier of the stations organization
   * @param {string} stationId the identifier of the station
   * @param {string} id the identifier of the dataset
   * @param {boolean} metadataOnly whether the dataset should only contain meta information and no information about its structure
   * @returns {Dataset | undefined} the dataset if it can be found
   */
   async getDataset(orgaId, stationId, id, metadataOnly = false) {
    let queryResult = await this.select(
      [
        Prefix.pht, Prefix.orga, Prefix.station,
        Prefix.rdf, Prefix.dcat, Prefix.dataset
      ],
      `SELECT ?id ?title ?desc ?key ?interfaceT ?interfaceFormat ?version ?interfaceShT ?anonymous WHERE 
    { 
      station:${stationId} rdf:type pht:Station;
      pht:responsibleOrganization orga:${orgaId};
      pht:hasDataSet dataset:${id}.
      
      dataset:${id} rdf:type pht:Dataset; 
      dcat:title ?title; 
      dcat:description ?desc;
      pht:accessThroughInterface ?interfaceID .

      ?interfaceID rdf:type ?interfaceT;

      #Interface might have a format ...
      OPTIONAL { ?interfaceID pht:interfaceHasFormat ?interfaceFormat . }

      #... or a shape
      OPTIONAL {
        ?interfaceID pht:hasInterfaceShape ?interfaceSh .
        ?interfaceSh a ?interfaceShT .

        OPTIONAL {?interfaceSh pht:dataInterfaceShapeHasKey ?key . }
      }
      OPTIONAL { ?interfaceID pht:dataInterfaceVersion ?version . } .

      #interface can allow anonymous access
      OPTIONAL { ?interfaceID pht:interfaceAllowsAnonymousAccess ?anonymous . } .
    }`
    );

    //Transform to model
    if (queryResult.length > 0)
    {
      let dataset = new Dataset(
        id,
        this.#resolveDatasetType(queryResult[0].interfaceFormat?.value, queryResult[0].interfaceShT?.value),
        queryResult[0].title.value,
        queryResult[0].desc.value, 
        queryResult[0].key?.value,
        this.#getSourceTypeFromIRI(queryResult[0].interfaceT.value), 
        queryResult[0].interfaceT.value,
        queryResult[0].version.value, 
        queryResult[0].interfaceFormat?.value, 
        queryResult[0].anonymous?.value
      );
      
      //Like when loading all datasets: dataset might still be broken, e.g. because of invalid data types
      //Therefore, load everything, but only set the tables when requested
      try {
        if (dataset.type.value != DatasetType.MimeType.value)
        {
          let tables = await this.#getTabularShapesForDb(dataset.id);
          if (!metadataOnly)
          {
            dataset.setTabular(tables);
          }
        } else 
        {
          //See if the specified type is valid
          this.#findComplexTypeForIri(dataset.title, dataset.formatType);
        }
      } catch {
        log.warn(`Dataset ${dataset.id} could not be loaded, ignoring dataset`);
        return undefined;
      }      

      return dataset;
    } else {
      return undefined;
    }
  }
} 

module.exports = QueryEngine; 