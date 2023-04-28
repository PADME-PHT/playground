const ParsingClient = require('sparql-http-client'); 
const { Readable } = require("stream");
const config = require("./../../config/index");


class SparqlClient extends ParsingClient {

  //------------------ Constructor ------------------
  constructor()
  {
    super({ endpointUrl: config.metadata.endpoint });
  }

  //------------------ public Methods ------------------
  
  /**
   * Sends a query to the metadata store, returns the resulting rows
   * @param {*} query The query that should be send
   * @returns A Readable Stream that can be iterated and contains the resulting rows
   */
  async select(sparqlQuery)
  {
    let result = await this.query.select(sparqlQuery);

    //Because of some mismatch between the stream implementation of the lib 
    //and the result (which seems to be a readable stream)
    //the result cannot actually be iterated -> Create own readable
    return await Readable.from(result).toArray();
  }
}

module.exports = SparqlClient; 