const Prefixes = require('./../../query-engine/prefix');
const prefix = Prefixes.datatype.value.replace(">", "").replace("<", ""); 
const fhir = Prefixes.fhir.value.replace(">", "").replace("<", ""); 
const primitiveTypes = require('./primitiveDataTypes');
const Enum = require('enum');

//DISCLAIMER: When adding new types, 
//1. Update the documentation at https://docs.padme-analytics.de/en/how-to/playground 
//2. Ensure that a plugin exists that is able to create instances of said type

module.exports = new Enum(
  {
    //Specific Types for Persons
    FirstName: { uri: `${prefix}firstName`, primitiveType: primitiveTypes.String },
    LastName: { uri: `${prefix}lastName`, primitiveType: primitiveTypes.String },
    FullName: { uri: `${prefix}fullName`, primitiveType: primitiveTypes.String },
    Gender: { uri: `${prefix}gender`, primitiveType: primitiveTypes.String },
    JobTitle: { uri: `${prefix}jobTitle`, primitiveType: primitiveTypes.String },
    Email: { uri: `${prefix}email`, primitiveType: primitiveTypes.String },
    Age: { uri: `${prefix}age`, primitiveType: primitiveTypes.UnsignedInt },

    //Address Info
    BuildingNumber: { uri: `${prefix}buildingNumber`, primitiveType: primitiveTypes.String },
    City: { uri: `${prefix}cityName`, primitiveType: primitiveTypes.String },
    Street: { uri: `${prefix}streetName`, primitiveType: primitiveTypes.String },
    Country: { uri: `${prefix}country`, primitiveType: primitiveTypes.String },
    ZipCode: { uri: `${prefix}zipCode`, primitiveType: primitiveTypes.UnsignedInt },

    //Commercial Info
    CompanyName: { uri: `${prefix}companyName`, primitiveType: primitiveTypes.String },

    //Identifier
    Uuid: { uri: `${prefix}uuid`, primitiveType: primitiveTypes.String },

    //Date & Time 
    Date: { uri: `${prefix}date`, primitiveType: primitiveTypes.String },

    //Text
    LoremIpsum: { uri: `${prefix}loremIpsum`, primitiveType: primitiveTypes.String },

    //Binary
    JPEGImage: { uri: `${prefix}image-jpeg`, primitiveType: primitiveTypes.Binary },
  
    //ISIC Dataset
    ISICBodySite: { uri: `${prefix}isicBodysite`, primitiveType: primitiveTypes.String },
    ISICLesionId: { uri: `${prefix}isicLesionId`, primitiveType: primitiveTypes.String },
    ISICGroundTruth: { uri: `${prefix}isicGroundTruth`, primitiveType: primitiveTypes.String },

    //FHIR Patient
    FhirPatientGender: { uri: `${fhir}Patient.gender`, primitiveType: primitiveTypes.String }, 
    FhirPatientBirthDate: { uri: `${fhir}Patient.birthDate`, primitiveType: primitiveTypes.String },

    //FHIR Media
    FhirMediaCreatedDateTime: { uri: `${fhir}Media.createdDateTime`, primitiveType: primitiveTypes.String },
    FhirMediaStatus: { uri: `${fhir}Media.status`, primitiveType: primitiveTypes.String },
  }
);