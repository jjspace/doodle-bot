const dbClient = require('../../db/dbClient');

module.exports = {
  name: 'addalias',
  description: 'Add alias to the given member',
  usage: 'addalias [member name] [alias]',
  execute(message, args) {
    if (!this.serverDb) {
      throw new Error('Missing ServerDb');
    }
    if (args.length < 2) {
      message.channel.send('Not enough arguments, need at least 2');
      return;
    }
    const displayName = args.shift();
    // TODO: try and turn this into allowing multiple with quotes around ones with spaces
    const newAlias = args.join(' ');

    const expectedName = dbClient.getExpectedName(this.serverDb, displayName);
    if (expectedName) {
      dbClient.addExpectedNameAlias(this.serverDb, displayName, [newAlias]);
      message.channel.send(`Alias "${newAlias}" added to display name "${displayName}"`);
    }
    else {
      message.channel.send(`Display Name "${displayName}" not found`);
    }
  },
};
