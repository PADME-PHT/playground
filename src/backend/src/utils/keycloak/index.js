

const config = require("./../../config/index");
const Keycloak = require('keycloak-connect');

//Disable login redirect and instead return a 401
Keycloak.prototype.redirectToLogin = function(req) {
  return false;
}
  
//configure keycloak
const keycloak = new Keycloak({}, config.keycloak);

module.exports = {
  keycloak
}