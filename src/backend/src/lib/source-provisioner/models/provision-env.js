const {v4: uuid} = require('uuid');
class ProvisionEnv
{
  constructor(name, value, description)
  {
    this.id = uuid();
    //Transform to valid env variable, see https://stackoverflow.com/a/2821183/5589776
    this.name = name.replace(/[^a-zA-Z0-9\_]/g, '')
    this.value = value;
    this.description = description;
  }
}

module.exports = ProvisionEnv