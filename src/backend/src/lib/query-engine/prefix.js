//The Prefixes that are used for your requests
//This way we have consistency trough out the app
const Enum = require('enum');

module.exports = new Enum(
  {
    pht: "<http://schema.padme-analytics.de#>",
    station: "<https://station-registry.hs-mittweida.de/api/stations/>",
    orga: "<https://station-registry.hs-mittweida.de/api/organizations/>",
    dataset: "<https://playgroundapi.padme-analytics.de/dataset/>",
    datatype: "<https://playgroundapi.padme-analytics.de/datatype/>",
    interface: "<https://playgroundapi.padme-analytics.de/interface/>",
    interfaceShape: "<https://playgroundapi.padme-analytics.de/interfaceShape/>",
    tabular: "<https://playgroundapi.padme-analytics.de/tabular/>",
    column: "<https://playgroundapi.padme-analytics.de/column/>",
    xsd: "<http://www.w3.org/2001/XMLSchema#>",
    rdfs: "<http://www.w3.org/2000/01/rdf-schema#>",
    rdf: "<http://www.w3.org/1999/02/22-rdf-syntax-ns#>",
    foaf: "<http://xmlns.com/foaf/0.1/#>",
    dcat: "<http://www.w3.org/ns/dcat/#>", 
    fhir: "<http://hl7.org/fhir/>", 
    object: "<https://playgroundapi.padme-analytics.de/object/>", 
    attribute: "<https://playgroundapi.padme-analytics.de/attribute/>"
  }
);