//A log entry that should be displayed to the user
class SessionLog
{
  constructor(id, type, message, station)
  {
    this.id = id;
    this.type = type;
    this.message = message;
    this.station = station;
  }
}

module.exports = SessionLog