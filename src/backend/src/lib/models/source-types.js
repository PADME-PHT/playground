const prefix = "http://schema.padme-analytics.de#"

module.exports = {
  PostgresSQL: `${prefix}PostgresInterface`,
  Blaze: `${prefix}BlazeInterface`,
  MinIO: `${prefix}MinIOInterface`,
  MySQL: `${prefix}MySQLInterface`,
  Mongo: `${prefix}MongoInterface`
}