
const complexTypes = require('../../../models/datatypes/complexDataTypes');
const { pickRandom } = require('./../../../../utils/arrayUtils');
const { faker } = require('@faker-js/faker');
const dayjs = require('dayjs');

class FhirPlugin {
  lookup = {};

  mediaStatus = ["preparation", "in-progress", "not-done", "on-hold", "stopped", "completed", "entered-in-error", "unknown"]

  gender = ["male", "female", "other", "unknown"]

  generateFhirDate()
  {
    //possible formats: YYYY, YYYY-MM, or YYYY-MM-DD
    //see https://www.hl7.org/fhir/datatypes.html#date
    let date = dayjs(faker.date.between('1930-01-01T00:00:00.000Z'));
    let format = Math.round(Math.random() * 2);
    switch (format)
    {
      case 0:
        return date.format("YYYY");
      case 1: 
        return date.format("YYYY-MM");
      case 2: 
        return date.format("YYYY-MM-DD");
    }
  }

  generateFhirDateTime()
  {
    //possible formats: YYYY, YYYY-MM, YYYY-MM-DD or YYYY-MM-DDThh:mm:ss+zz:zz
    //see https://www.hl7.org/fhir/datatypes.html#dateTime
    let format = Math.round(Math.random() * 3);
    switch (format)
    {
      case 0:
      case 1:
      case 2:
        return this.generateFhirDate();
      case 3: 
        let date = dayjs(faker.date.between('1930-01-01T00:00:00.000Z'));
        return date.format("YYYY-MM-DDTHH:mm:ssZ");
    }
  }

  constructor() {
    this.lookup[complexTypes.FhirPatientGender.value.uri] = () => pickRandom(this.gender);
    this.lookup[complexTypes.FhirPatientBirthDate.value.uri] = () => this.generateFhirDate();
    this.lookup[complexTypes.FhirMediaCreatedDateTime.value.uri] = () => this.generateFhirDateTime();
    this.lookup[complexTypes.FhirMediaStatus.value.uri] = () => pickRandom(this.mediaStatus);
  }

  /**
  * Creates a instance of the datatype with the provided iri
  * @param {*} iri 
  * @param {*} length 
  * @returns 
  */
  createInstance(iri, length) {
    return this.lookup[iri]();
  }

}
module.exports.info = [
  complexTypes.FhirPatientGender.value.uri, 
  complexTypes.FhirPatientBirthDate.value.uri,
  complexTypes.FhirMediaCreatedDateTime.value.uri, 
  complexTypes.FhirMediaStatus.value.uri
]
module.exports.class = FhirPlugin;
module.exports.enabled = true;