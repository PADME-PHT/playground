import { Injectable } from '@angular/core';
import { Route } from 'src/app/model/route';
import { Session } from 'src/app/model/session';
import { StateManagerService } from './state-manager';
import { environment } from 'src/environments/environment';
import { DataTypeKind } from 'src/app/model/data-type-kind';
import { DatasetType } from 'src/app/model/dataset-type';

@Injectable({
  providedIn: 'root'
})

export class StateManagerServiceMock extends StateManagerService {

  /**
   * @returns the last stored session object
   */
  override getSessionId() : string
  {
    let res = super.getSessionId(); 
    if (res)
    {
      return res;  
    }

    return environment.defaultSessionId;
  }

   /**
    * @returns the last stored route object
    */
  override getRoute(): Route {
    
    let res = super.getRoute(); 
    if (res)
    {
      return res;  
    }

    return {
      halts: [
        {
          station: {
            id: "5bce186a-5005-4ca8-878e-9d8d4e0747c0",
            name: "Klee",
            description: "Klee Station",
            ownEnvs: [],
            envs: [
              {
                id: "5c5e96cd-9335-4500-aa49-62761cd2bb6a",
                name: "DATA_SOURCE_ADDRESS",
                value: "menzel.informatik.rwth-aachen.de",
                initialValue: "somedb",
                description: "The target hostname or ip of the data source"
              },
              {
                id: "5c5e96cd-9335-4500-aa49-62761cd2bb6a",
                name: "DATA_SOURCE_VERSION",
                value: "14.0.0",
                initialValue: "15.0.0",
                description: "The target hostname or ip of the data source"
              },
              {
                id: "5c5e96cd-9335-4500-aa49-62761cd2bb6a",
                name: "MINIO_BUCKET",
                value: "isic2019",
                initialValue: "isic2019",
                description: "The target hostname or ip of the data source"
              },
              {
                id: "bd75b048-1cc8-4177-afd9-73dbbf739dcc",
                name: "DATA_SOURCE_PORT",
                value: "32768",
                initialValue: "12345",
                description: "The target port of the data source"
              },
              {
                id: "4b21b76c-f62e-4736-9847-1a083e8b3874",
                name: "DATA_SOURCE_PASSWORD",
                value: "pAeQC7",
                initialValue: "pAeQC7",
                description: "The password used for authentication at the data source"
              },
              {
                id: "fd3256eb-ab01-46c0-a59f-be7b750e0baf",
                name: "DATA_SOURCE_USERNAME",
                value: "postgres",
                initialValue: "postgres",
                description: "The username used for authentication at the data source"
              }
            ],
            datasets: [
              {
                id: "b3af83ba-38f1-4108-b7c9-fc8779c5f2cb",
                description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin vehicula, leo in congue auctor, dui nulla auctor est, a finibus tortor ex consequat elit. Etiam efficitur rhoncus urna, a fringilla augue mollis in. Phasellus lorem libero, viverra a quam sollicitudin, auctor tincidunt quam. Sed eu turpis dapibus dui tempor accumsan vitae et felis. Aliquam tempus arcu nec odio scelerisque pellentesque. Quisque eget auctor mi. Nam ultricies sapien nec rutrum interdum.", 
                title: "Universities",
                key: "universitydb", 
                sourceType: "PostgresSQL", 
                type: DatasetType.Relational,
                allowsAnonymousAccess: undefined,
                formatType: undefined,
                sourceTypeVersion: "14.0.0.0",
                tables: [
                  {
                      columns: [
                          {
                            id: "412844b6-f198-11ec-8ea0-0242ac120002",
                            dataTypeKind: DataTypeKind.Atomic,
                              key: "id",
                              datatype:
                              {
                                iri: "Test",
                                name: "Test",
                              },
                              value: undefined,
                              isUnique: true, 
                              referenceTo: "021f989a-f18a-11ec-8ea0-0242ac120002"
                          },
                          {
                              id: "9bf173e4-f18a-11ec-8ea0-0242ac120002",
                              dataTypeKind: DataTypeKind.Atomic,
                              datatype:
                              {
                                  
                                iri: "Test",
                                name: "long_data_type",
                              },
                              value: undefined,
                              key: "very_very_long_name", 
                              isUnique: true, 
                              referenceTo: "021f989a-f18a-11ec-8ea0-0242ac120002"
                          }
                      ],
                      id: "021f99e4-f18a-11ec-8ea0-0242ac120002",
                      key: "states"
                  },
                  {
                      columns: [
                          {
                            id: "021f989a-f18a-11ec-8ea0-0242ac120002",
                            dataTypeKind: DataTypeKind.Atomic,
                            key: "stateId",
                            value: undefined,
                            datatype:
                            {
                              iri: "Test",
                              name: "Test",
                            },
                            referenceTo: "412844b6-f198-11ec-8ea0-0242ac120002"
                          },
                          {
                            id: "c4fa91b8-f189-11ec-8ea0-0242ac120002",
                            dataTypeKind: DataTypeKind.Atomic,
                             
                            key: "id",
                            value: undefined,
                            datatype:
                            {
                              iri: "Test",
                              name: "Test",
                            },
                            isUnique: true
                          },
                          {
                            id: "e7ba6a02-f189-11ec-8ea0-0242ac120002",
                            dataTypeKind: DataTypeKind.Atomic,
                            value: undefined,
                            datatype:
                            {
                              iri: "Test",
                              name: "Test",
                            },
                            key: "name"
                          },
                          {
                            id: "e7ba6c96-f189-11ec-8ea0-0242ac120002",
                            dataTypeKind: DataTypeKind.Atomic,
                            value: undefined,
                            datatype:
                            {
                              iri: "Test",
                              name: "Test",
                            },
                            key: "postcode"
                          },
                          {
                            id: "e7ba6dc2-f189-11ec-8ea0-0242ac120002",
                            dataTypeKind: DataTypeKind.Atomic,
                            value: undefined,
                            datatype:
                            {
                              iri: "Test",
                              name: "Test",
                            },
                            key: "hasUniveristy"
                          }
                      ],
                      id: "96ed17c8-f189-11ec-8ea0-0242ac120002",
                      key: "cities"
                  }
                ]
              }, 
              {
                id: "b3af83ba-38f1-4108-b7s9-fc8779c5f2cb",
                description: "Another Dataset", 
                title: "Universities 2",
                key: "testdb", 
                sourceType: "MySql", 
                type: DatasetType.Relational,
                allowsAnonymousAccess: undefined,
                formatType: undefined,
                sourceTypeVersion: "8.0.0.0",
                tables: [
                  {
                      columns: [
                          {
                            id: "412844b6-f198-11ec-8ea0-0242ac120002",
                            dataTypeKind: DataTypeKind.Atomic,
                            key: "id",
                            value: undefined,
                            datatype:
                            {
                              iri: "Test",
                              name: "Test",
                            },
                            isUnique: true
                          },
                          {
                            id: "9bf173e4-f18a-11ec-8ea0-0242ac120002",
                            dataTypeKind: DataTypeKind.Atomic,
                            value: undefined,
                            datatype:
                            {
                              iri: "Test",
                              name: "Test",
                            },
                            key: "name"
                          }
                      ],
                      id: "021f99e4-f18a-11ec-8ea0-0242ac120002",
                      key: "states"
                  },
                  {
                      columns: [
                          {
                            id: "021f989a-f18a-11ec-8ea0-0242ac120002",
                            dataTypeKind: DataTypeKind.Atomic,
                            key: "stateId",
                            value: undefined,
                            datatype:
                            {
                              iri: "Test",
                              name: "Test",
                            },
                            referenceTo: "412844b6-f198-11ec-8ea0-0242ac120002"
                          },
                        {
                            id: "c4fa91b8-f189-11ec-8ea0-0242ac120002",
                            dataTypeKind: DataTypeKind.Atomic,
                            key: "id",
                            value: undefined,
                            datatype:
                            {
                              iri: "Test",
                              name: "Test",
                            },
                            isUnique: true
                          },
                          {
                            id: "e7ba6a02-f189-11ec-8ea0-0242ac120002",
                            dataTypeKind: DataTypeKind.Atomic,
                            value: undefined,
                            datatype:
                            {
                              iri: "Test",
                              name: "Test",
                            },
                            key: "name"
                          },
                          {
                            id: "e7ba6c96-f189-11ec-8ea0-0242ac120002",
                            dataTypeKind: DataTypeKind.Atomic,
                            value: undefined,
                            datatype:
                            {
                              iri: "Test",
                              name: "Test",
                            },
                            key: "postcode"
                          },
                          {
                            id: "e7ba6dc2-f189-11ec-8ea0-0242ac120002",
                            dataTypeKind: DataTypeKind.Atomic,
                            value: undefined,
                            datatype:
                            {
                              iri: "Test",
                              name: "Test",
                            },
                            key: "hasUniveristy"
                          }
                      ],
                      id: "96ed17c8-f189-11ec-8ea0-0242ac120002",
                      key: "cities"
                  }
                ]
              }
            ]
          }, 
          organization: {
            id: "f0a6e2c0-ed2a-4ef4-bdfb-ea853b6f7706", 
            name: "RWTH Aachen", 
            stations: []
          }
        }, 
        {
          station: {
            id: "d7b0a9a7-07fd-4a31-b93a-3c946dc82667", 
            name: "Bruegel", 
            description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
            ownEnvs: [],
            envs: [
              {
                id: "5c5e96cd-9335-4500-aa49-62761cd2bb6a",
                name: "DATA_SOURCE_ADDRESS",
                value: "somedb",
                initialValue: "somedb",
                description: "The target hostname or ip of the data source"
              },
              {
                id: "bd75b048-1cc8-4177-afd9-73dbbf739dcc",
                name: "DATA_SOURCE_PORT",
                value: "4576",
                initialValue: "4576",
                description: "The target port of the data source"
              },
              {
                id: "4b21b76c-f62e-4736-9847-1a083e8b3874",
                name: "DATA_SOURCE_PASSWORD",
                value: "1234test",
                initialValue: "1234test",
                description: "The password used for authentication at the data source"
              },
              {
                id: "fd3256eb-ab01-46c0-a59f-be7b750e0baf",
                name: "DATA_SOURCE_USERNAME",
                value: "postgres",
                initialValue: "postgres",
                description: "The username used for authentication at the data source"
              }
            ],
            datasets: [
              {
                id: "b3af83ba-38f1-4108-b7s9-fc8779c5f2cb",
                description: "Another Dataset", 
                title: "Testdb",
                key: "testdb", 
                sourceType: "MySql", 
                formatType: undefined,
                allowsAnonymousAccess: undefined,
                type: DatasetType.Relational,
                sourceTypeVersion: "8.0.0.0",
                tables: [
                  {
                      columns: [
                          {
                          id: "412844b6-f198-11ec-8ea0-0242ac120002",
                           
                          dataTypeKind: DataTypeKind.Atomic,
                          key: "id",
                          value: undefined,
                            datatype:
                            {
                              iri: "Test",
                              name: "Test",
                            },
                            isUnique: true
                          },
                          {
                            id: "9bf173e4-f18a-11ec-8ea0-0242ac120002",
                             
                            dataTypeKind: DataTypeKind.Atomic,
                            value: undefined,
                            datatype:
                            {
                              iri: "Test",
                              name: "Test",
                            },
                            key: "name"
                          }
                      ],
                      id: "021f99e4-f18a-11ec-8ea0-0242ac120002",
                      key: "states"
                  },
                  {
                      columns: [
                          {
                            id: "021f989a-f18a-11ec-8ea0-0242ac120002",
                             
                            dataTypeKind: DataTypeKind.Atomic,
                            key: "stateId",
                            value: undefined,
                            datatype:
                            {
                              iri: "Test",
                              name: "Test",
                            },
                            referenceTo: "412844b6-f198-11ec-8ea0-0242ac120002"
                          },
                          {
                            id: "c4fa91b8-f189-11ec-8ea0-0242ac120002",
                             
                            dataTypeKind: DataTypeKind.Atomic,
                            key: "id",
                            value: undefined,
                            datatype:
                            {
                              iri: "Test",
                              name: "Test",
                            },
                            isUnique: true
                          },
                          {
                            id: "e7ba6a02-f189-11ec-8ea0-0242ac120002",
                             
                            dataTypeKind: DataTypeKind.Atomic,
                            value: undefined,
                            datatype:
                            {
                              iri: "Test",
                              name: "Test",
                            },
                            key: "name"
                          },
                          {
                            id: "e7ba6c96-f189-11ec-8ea0-0242ac120002",
                             
                            dataTypeKind: DataTypeKind.Atomic,
                            value: undefined,
                            datatype:
                            {
                              iri: "Test",
                              name: "Test",
                            },
                            key: "postcode"
                          },
                          {
                            id: "e7ba6dc2-f189-11ec-8ea0-0242ac120002",
                             
                            dataTypeKind: DataTypeKind.Atomic,
                            value: undefined,
                            datatype:
                            {
                              iri: "Test",
                              name: "Test",
                            },
                            key: "hasUniveristy"
                          }
                      ],
                      id: "96ed17c8-f189-11ec-8ea0-0242ac120002",
                      key: "cities"
                  }
                ]
              },
              {
                id: "b3af83ba-38f1-4108-b7c9-fc8779c5f2cb",
                description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin vehicula, leo in congue auctor, dui nulla auctor est, a finibus tortor ex consequat elit. Etiam efficitur rhoncus urna, a fringilla augue mollis in. Phasellus lorem libero, viverra a quam sollicitudin, auctor tincidunt quam. Sed eu turpis dapibus dui tempor accumsan vitae et felis. Aliquam tempus arcu nec odio scelerisque pellentesque. Quisque eget auctor mi. Nam ultricies sapien nec rutrum interdum.",
                title: "Universities",
                key: "universitydb",
                sourceType: "PostgresSQL",
                formatType: undefined,
                allowsAnonymousAccess: undefined,
                type: DatasetType.Relational,
                sourceTypeVersion: "14.0.0.0",
                tables: [
                  {
                    columns: [
                      {
                        id: "412844b6-f198-11ec-8ea0-0242ac120002",
                         
                        dataTypeKind: DataTypeKind.Atomic,
                        value: undefined,
                        key: "id",
                        datatype:
                        {
                          iri: "Test",
                          name: "Test",
                        },
                        isUnique: true
                      },
                      {
                        id: "9bf173e4-f18a-11ec-8ea0-0242ac120002",
                         
                        dataTypeKind: DataTypeKind.Atomic,
                        value: undefined,
                        datatype:
                        {
                          iri: "Test",
                          name: "Test",
                        },
                        key: "name"
                      }
                    ],
                    id: "021f99e4-f18a-11ec-8ea0-0242ac120002",
                    key: "states"
                  },
                  {
                    columns: [
                      {
                        id: "021f989a-f18a-11ec-8ea0-0242ac120002",
                        dataTypeKind: DataTypeKind.Atomic,
                         
                        value: undefined,
                        key: "stateId",
                        datatype:
                        {
                          iri: "Test",
                          name: "Test",
                        },
                        referenceTo: "412844b6-f198-11ec-8ea0-0242ac120002"
                      },
                      {
                        id: "c4fa91b8-f189-11ec-8ea0-0242ac120002",
                         
                        dataTypeKind: DataTypeKind.Atomic,
                        value: undefined,
                        key: "id",
                        datatype:
                        {
                          iri: "Test",
                          name: "Test",
                        },
                        isUnique: true
                      },
                      {
                        id: "e7ba6a02-f189-11ec-8ea0-0242ac120002",
                         
                        dataTypeKind: DataTypeKind.Atomic,
                        value: undefined,
                        datatype:
                        {
                          iri: "Test",
                          name: "Test",
                        },
                        key: "name"
                      },
                      {
                        id: "e7ba6c96-f189-11ec-8ea0-0242ac120002",
                         
                        dataTypeKind: DataTypeKind.Atomic,
                        value: undefined,
                        datatype:
                        {
                          iri: "Test",
                          name: "Test",
                        },
                        key: "postcode"
                      },
                      {
                        id: "e7ba6dc2-f189-11ec-8ea0-0242ac120002",
                         
                        dataTypeKind: DataTypeKind.Atomic,
                        value: undefined,
                        datatype:
                        {
                          iri: "Test",
                          name: "Test",
                        },
                        key: "hasUniveristy"
                      }
                    ],
                    id: "96ed17c8-f189-11ec-8ea0-0242ac120002",
                    key: "cities"
                  }
                ]
              }
            ]
          }, 
          organization: {
            id: "796d879a-94e4-4f60-bf5d-66cf75c88dfc", 
            name: "University Medical Center Cologne", 
            stations: []
          }
        }
      ]
    }
   }
}