const dbClient = require('../../db/dbClient');

module.exports = {
  name: 'members',
  description: 'Show the expected members list',
  execute(message) {
    if (!this.serverDb) {
      throw new Error('Missing ServerDb');
    }
    const names = dbClient
      .getExpectedNames(this.serverDb)
      .map((expectedName) => expectedName.displayName);
    message.channel.send(`**Members**: ${names.length ? names.join(', ') : 'No members'}`);
  },
};
