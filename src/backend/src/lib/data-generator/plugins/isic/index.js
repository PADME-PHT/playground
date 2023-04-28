const { createRandomUnsignedInt} = require('./../../../../utils/randUtils');
const complexTypes = require('../../../models/datatypes/complexDataTypes');
const { pickRandom } = require('./../../../../utils/arrayUtils');


class ISICPlugin
{
  lookup = {};

  bodySites = ['anterior torso', 'upper extremity', 'posterior torso', 'lower extremity', 'lateral torso', 'head/neck', 'palms/soles', 'oral/genital'];
  groundTruth = ['NV', 'MEL', 'BKL', 'DF', 'SCC', 'BCC', 'VASC', 'AK']; 
  datasetPrefixes = ['HAM', 'MSK4', 'BCN'];

  pad(num, size) {
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
  }

  createLesionId()
  {
    //Creates something in the format PREFIX_000XXXX with XXXX being a number
    //and the number of 0s padded to the length of 7
    let length = Math.round(Math.random() * 7); 
    let number = createRandomUnsignedInt(length);
    let pad = this.pad(number, 7);
    return `${pickRandom(this.datasetPrefixes)}_${pad}`;
  }

  constructor() {
    this.lookup[complexTypes.ISICBodySite.value.uri] = () => pickRandom(this.bodySites);
    this.lookup[complexTypes.ISICLesionId.value.uri] = () => this.createLesionId();
    this.lookup[complexTypes.ISICGroundTruth.value.uri] = () => pickRandom(this.groundTruth);
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
  complexTypes.ISICBodySite.value.uri, 
  complexTypes.ISICLesionId.value.uri,
  complexTypes.ISICGroundTruth.value.uri
]
module.exports.class = ISICPlugin;
module.exports.enabled = true;