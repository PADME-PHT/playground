class GenerationResult
{
  constructor()
  {
    this.tables = {};
    this.mimeTypeResult = undefined;
  }

  /**
   * Adds a generation result for a dataset that is based on mime types
   * @param {*} result 
   */
  addGenerationResultForMimeTypes(result)
  {
    this.mimeTypeResult = result;
  }

  /**
   * @returns The generation result for a mimetype based dataset
   */
  getGenerationResultForMimeTypes()
  {
    return this.mimeTypeResult;
  }

  /**
   * Adds results for the table with the given key
   * @param {*} tableKey 
   * @param {*} result 
   */
  addGenerationResultForTable(tableKey, result)
  {
    if (!this.tables[tableKey])
    {
      this.tables[tableKey] = [];  
    }
    this.tables[tableKey].push(...result);
  }

  /***
   * @returns all generation results, index by the table key
   */
  getAllResults()
  {
    return this.tables;
  }

  /**
   * @param {*} tableKey The key to look for
   * @returns the generated instance for the table with the given key
   */
  getResultForTable(tableKey)
  {
    if (this.tables[tableKey])
    {
      return this.tables[tableKey];  
    }
    return [];
  }
}

module.exports = GenerationResult