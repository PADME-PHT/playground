class Organization
{
  constructor(id, name)
  {
    this.id = id;  
    this.name = name;
    this.stations = undefined;
  }

  /**
   * Sets the organizations stations to the provided value
   * @param {*} stations 
   */
  setStations(stations)
  {
    this.stations = stations;
  }
}

module.exports = Organization