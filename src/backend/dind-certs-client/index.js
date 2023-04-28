const fs = require('fs')
const certs = {
    ca: fs.readFileSync(`${__dirname}/certs/ca.pem`),
    key: fs.readFileSync(`${__dirname}/certs/key.pem`),
    cert: fs.readFileSync(`${__dirname}/certs/cert.pem`),
};

module.exports = {
    getAgentOptions: () => {
        return {
            ca: certs.ca,
            cert: certs.cert,
            key: certs.key,
        }
    }
};