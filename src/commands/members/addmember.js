const dbClient = require('../../db/dbClient');

module.exports = {
  name: 'addmember',
  description: 'Add member to expected members list',
  execute(message, args) {
    if (!this.serverDb) {
      throw new Error('Missing ServerDb');
    }
    if (args.length < 1) {
      message.channel.send('Incorrect number of arguments, need at least one');
    }
    const newName = args.join(' ');

    dbClient.addExpectedName(this.serverDb, {
      displayName: newName,
      aliases: [newName],
    });

    message.channel.send(`"${newName}" added to members`);
  },
};
