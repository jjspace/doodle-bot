const dbClient = require('../../db/dbClient');

module.exports = {
  name: 'delmember',
  description: 'Delete member from expected members list, includes aliases',
  execute(message, args) {
    if (!this.serverDb) {
      throw new Error('Missing ServerDb');
    }
    if (args.length < 1) {
      message.channel.send('Incorrect number of arguments, need at least one');
    }
    const displayName = args.join(' ');

    dbClient.removeExpectedName(this.serverDb, displayName);

    message.channel.send(`"${displayName}" removed from members`);
  },
};
