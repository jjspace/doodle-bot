const dbClient = require('../../db/dbClient');

module.exports = {
  name: 'doodles',
  description: 'List all currently tracked Doodle Polls',
  execute(message) {
    if (!this.serverDb) {
      throw new Error('Missing ServerDb');
    }
    const doodles = dbClient
      .getDoodles(this.serverDb)
      .map((doodle) => `${doodle.name} - ${doodle.id}`);

    message.channel.send(doodles.length ? doodles.join('\n') : 'No Doodles being tracked');
  },
};
