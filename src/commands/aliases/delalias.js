const dbClient = require('../../db/dbClient');

module.exports = {
  name: 'delalias',
  description: 'Remove an alias from the specified member',
  usage: 'delalias [member name] [alias]',
  execute(message, args) {
    if (!this.serverDb) {
      throw new Error('Missing ServerDb');
    }
    if (args.length !== 2) {
      message.channel.send('Wrong number of arguments, need 2');
      return;
    }

    const displayName = args.shift();
    const aliasToRemove = args.shift();
    const expectedName = dbClient.getExpectedName(this.serverDb, displayName);
    if (expectedName) {
      dbClient.removeExpectedNameAlias(this.serverDb, displayName, aliasToRemove);
      message.channel.send(`Alias "${aliasToRemove}" removed from ${displayName}`);
    }
    else {
      message.channel.send(`Display Name "${displayName}" not found`);
    }
  },
};
