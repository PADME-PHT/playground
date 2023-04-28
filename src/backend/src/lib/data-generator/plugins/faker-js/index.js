
const complexTypes = require('../../../models/datatypes/complexDataTypes');
const { faker } = require('@faker-js/faker');

class FakeJsPlugin
{
  lookup = {};

  constructor() {
    faker.setLocale('de');

    this.lookup[complexTypes.FirstName.value.uri] = () => faker.name.firstName();
    this.lookup[complexTypes.LastName.value.uri] = () => faker.name.lastName();
    this.lookup[complexTypes.FullName.value.uri] = () => `${faker.name.firstName()} ${faker.name.lastName()}`
    this.lookup[complexTypes.JobTitle.value.uri] = () => faker.name.jobTitle();
    this.lookup[complexTypes.Email.value.uri] = () => faker.internet.email();
    this.lookup[complexTypes.BuildingNumber.value.uri] = () => faker.address.buildingNumber();
    this.lookup[complexTypes.City.value.uri] = () => faker.address.cityName();
    this.lookup[complexTypes.Street.value.uri] = () => faker.address.streetName();
    this.lookup[complexTypes.Country.value.uri] = () => faker.address.country();
    this.lookup[complexTypes.ZipCode.value.uri] = () => faker.address.zipCode('#####');
    this.lookup[complexTypes.CompanyName.value.uri] = () => faker.company.companyName(); //will be replaced with name() soon
    this.lookup[complexTypes.Uuid.value.uri] = () => faker.datatype.uuid();
    this.lookup[complexTypes.Date.value.uri] = () => faker.date.between('2000-01-01T00:00:00.000Z').toISOString();
    this.lookup[complexTypes.LoremIpsum.value.uri]= (length) => `${faker.lorem.paragraph().substring(0, length - 1).trim()}.`;
  }

  /**
   * Creates a instance of the datatype with the provided iri
   * @param {*} iri 
   * @param {*} length 
   * @returns 
   */
  createInstance(iri, length)
  {
    return this.lookup[iri](length);
  }
}

module.exports.info = [
  complexTypes.FirstName.value.uri,
  complexTypes.LastName.value.uri,
  complexTypes.FullName.value.uri,
  complexTypes.JobTitle.value.uri,
  complexTypes.Email.value.uri,
  complexTypes.BuildingNumber.value.uri,
  complexTypes.City.value.uri, 
  complexTypes.Street.value.uri, 
  complexTypes.Country.value.uri, 
  complexTypes.ZipCode.value.uri, 
  complexTypes.CompanyName.value.uri, 
  complexTypes.Uuid.value.uri, 
  complexTypes.Date.value.uri, 
  complexTypes.LoremIpsum.value.uri
]
module.exports.class = FakeJsPlugin;
module.exports.enabled = true;