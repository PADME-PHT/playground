class Station
{
  constructor(id, name, description)
  {
    this.id = id; 
    this.name = name;
    this.description = description;
    this.datasets = undefined;
  }

  /**
   * Sets the stations datasets to the provided value
   * @param {*} datasets 
   */
  setDatasets(datasets)
  {
    this.datasets = datasets;
  }
}

module.exports = Station