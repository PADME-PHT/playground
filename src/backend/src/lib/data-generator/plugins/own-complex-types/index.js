
const complexTypes = require('../../../models/datatypes/complexDataTypes');
const { pickRandom } = require('./../../../../utils/arrayUtils');

class CustomComplexTypesPlugin
{
  lookup = {};
  genders = ['Männlich', 'Weiblich', 'Divers'];

  constructor() {
    this.lookup[complexTypes.Age.value.uri] = () => this.generateRandomInteger(0, 100);
    this.lookup[complexTypes.Gender.value.uri] = () => pickRandom(this.genders);
  }

  generateRandomInteger(min, max) {
    return Math.floor(min + Math.random()*(max - min + 1))
  }

  /**
   * Creates a instance of the datatype with the provided iri
   * @param {*} iri 
   * @param {*} length 
   * @returns 
   */
  createInstance(iri, length)
  {
    return this.lookup[iri]();
  }
}

module.exports.info = [
  complexTypes.Age.value.uri, 
  complexTypes.Gender.value.uri, 
]
module.exports.class = CustomComplexTypesPlugin;
module.exports.enabled = true;