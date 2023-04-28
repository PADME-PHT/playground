const Graph = require("graph-data-structure");
const DataTypes = require("./datatypes");
const _ = require('lodash');

class Dataset
{
  
  constructor(id, type, title, description, key, sourceType, sourceTypeIRI, sourceTypeVersion, formatType, allowsAnonymousAccess)
  {
    this.id = id; 
    //Instance of dataset type
    this.type = type;
    this.title = title;
    this.description = description;
    this.key = key;
    this.sourceType = sourceType; 
    this.sourceTypeIRI = sourceTypeIRI; 
    this.sourceTypeVersion = sourceTypeVersion;
    this.formatType = formatType;
    this.allowsAnonymousAccess = allowsAnonymousAccess;
    this.tables = undefined;
    this._sorted = undefined;
    this._columnLookup = undefined;
  }

  setTabular(tables)
  {
    this.tables = tables;
    this._sorted = undefined;
  }

  /**
   * @returns The tables of the data source, sorted topologically 
   * by the references the table has. May throw an error if the 
   * tables has circular references
   */
  getTablesSortedByTopology()
  {
    //Sort if it wasn't already
    if (!this._sorted) {
      this._sorted = this.#getTopologicalSorting();
    }
    return this._sorted;
  }

  /**
   * Returns a dictionary with the table key as index and a list of all (recursive) columns as value
   * @returns 
   */
  getFlattenedTableColumns()
  {
    if (!this._columnLookup)
    {
      this._columnLookup = {};
      this.tables.forEach((table) => {
        //Store all columns of this table
        this._columnLookup[table.key] = this.#flattenTableTree(table);
      });
    }
    
    return this._columnLookup;
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
   * Recursive part of flattening the table 
   * @param {*} table 
   * @param {*} columns 
   */
  #flattenTableTreeRecursive(table, columns) {
    //First, add the current columns
    this.#concat(columns, table.columns);

    //Get columns with sub objects
    let objects = table.columns.filter(column => column.dataTypeKind == DataTypes.Object);
    objects.forEach(obj => this.#flattenTableTreeRecursive(obj.datatype, columns)); 

    //Get columns with lists
    //List can be: objects, atomic types and attributes
    //We need to find objects and attributes that have a references attribute

    //First: List of objects
    let listObjects = table.columns.filter(column =>
      column.dataTypeKind == DataTypes.List &&
      column.datatype.dataTypeKind == DataTypes.Object
    );
    listObjects.forEach(obj => this.#flattenTableTreeRecursive(obj.datatype.datatype, columns));

    //Lastly, of attributes that have a references attribute
    let attributes = table.columns.filter(column =>
      column.dataTypeKind == DataTypes.List &&
      column.datatype.dataTypeKind == DataTypes.Attribute && 
      column.datatype.referenceTo != undefined
    );

    this.#concat(columns, attributes.map(attr => attr.datatype));
  }

  /**
   * Creates a flattened list of the table columns be flattening the tree composed by the table
   * @param {TableSchema} table 
   */
  #flattenTableTree(table)
  {
    let columns = [];

    this.#flattenTableTreeRecursive(table, columns); 
    return columns;
  }

  #getTopologicalSorting() {
    let graph = new Graph();
    let tableLookup = {};
    let columnLookup = {};

    //Add each Table as a node
    this.tables.forEach((table) => {
      graph.addNode(table.key);
      tableLookup[table.key] = table;
      //Store all columns of this table
      columnLookup[table.key] = this.#flattenTableTree(table);
    });

    //For all tables and columns that have a reference
    for (let table of this.tables)
    {
      for (let column of columnLookup[table.key].filter(c => c.referenceTo))
      {
        let referenceTable = _.find(this.tables, (table) => _.find(columnLookup[table.key], { id: column.referenceTo }));
  
        //Add the nodes in the reverse order (what is used by what)
        //In this case, reference Table needs to be created first
        graph.addEdge(referenceTable.key, table.key);
      }
    }
  
    if (graph.hasCycle())
    {
      throw new Error("Could not instantiate database because the tables have circular references");
    }

    return graph.topologicalSort().map(key => tableLookup[key]);
  }
}

module.exports = Dataset