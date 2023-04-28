class AtomicDataType
{
  /**
   * Creates a new Instance of the provided atomic data type
   * Relates to atomic datatypes from the metadata schema meaning this can be a complex or primitive datatype
   * @param {*} id 
   * @param {*} name 
   * @param {string} primitiveTypeIri The Iri of the primitiveType used for this datatype
   * @param {*} length How long the datatype should be, defaults to undefined if no length bigger than 0 is given
   */
  constructor(iri, name, primitiveTypeIri, length)
  {
    this.iri = iri;  
    this.name = name;
    this.primitiveTypeIri = primitiveTypeIri;
    this.length = length && length > 0 ? length : undefined;
  }
}

module.exports = AtomicDataType