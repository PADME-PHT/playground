class Tabular
{
  columns = [];

  constructor(id, key)
  {
    this.id = id;
    this.key = key;
  }

  setColumns(columns)
  {
    this.columns = columns;
  }
}

module.exports = Tabular