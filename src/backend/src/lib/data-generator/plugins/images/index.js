const { createRandomUnsignedInt} = require('./../../../../utils/randUtils');
const complexTypes = require('../../../models/datatypes/complexDataTypes');
const log = require("loglevel").getLogger("imagesPlugin");
const path = require("path");
const fs = require("fs");

ASSETS_FOLDER = "assets"

class ImagesPlugin {
  lookup = {};

  /**
   * Picks a random file from the subfolder of the given type
   * @param {string} type 
   * @returns 
   */
  async getRandomFileStream(type)
  {
    //Get a random file
    const dirPath = path.join(__dirname, ASSETS_FOLDER, type);
    const files = await fs.promises.readdir(dirPath);
    //Filter files to only includes once in the correct format (x.jpg)
    const filteredFiles = files.filter(file => /\d+.jpg/.test(file))
    const index = Math.round(Math.random() * (filteredFiles.length - 1));
    const file = filteredFiles[index];
    return fs.createReadStream(path.join(dirPath, file));
  }

  /**
   * Downloads a new image and stores the result in the cache
   * @param {*} imageUrl 
   */
  async getImage(type)
  {
    log.info(`Getting image for type ${type}`);
    let stream = await this.getRandomFileStream(type);

    //Read it into a buffer
    const buffers = [];
    for await (const data of stream) {
      buffers.push(data);
    }

    return Buffer.concat(buffers);
  } 
  
  /**
   * returns an image type for the assets folder
   * @returns 
   */
  getImageType()
  {
    //Number between 2 and 6
    let format = Math.round(Math.random() * 4) + 2;
    switch (format)
    {
      case 0:
        return "abstract"
      case 1:
        return "business"
      case 2:
        return "city"
      case 3:
        return "nature"
      case 4:
        return "sports"
      case 5:
        return "technics"
      case 6:
        return "transport"
    }
  }

  /**
   * Pads the given number with zeros up to the given size
   * @param {*} num 
   * @param {*} size 
   * @returns 
   */
  pad(num, size) {
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
  }

  /**
   * Creates a filename for a image
   */
  getImageName()
  {
    let length = Math.round(Math.random() * 8);
    let number = createRandomUnsignedInt(length);
    let pad = this.pad(number, 8);
    return `image${pad}.jpeg`;
  }

  /**
   * @returns an object with a name and content
   */
  async createImage() {
    let type = this.getImageType();
    let name = this.getImageName();
    let buffer = await this.getImage(type);
    return {name: name, content: buffer};
  }

  constructor() {
    this.lookup[complexTypes.JPEGImage.value.uri] = () => this.createImage();
  } 

   /**
   * Creates a instance of the datatype with the provided iri
   * @param {*} iri 
   * @param {*} length 
   * @returns 
   */
  async createInstance(iri, length)
  {
    return await this.lookup[iri]();
  }
}

module.exports.info = [
  complexTypes.JPEGImage.value.uri, 
]
module.exports.class = ImagesPlugin;
module.exports.enabled = true;