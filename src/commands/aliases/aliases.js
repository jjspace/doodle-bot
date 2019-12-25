const dbClient = require('../../db/dbClient');

module.exports = {
  name: 'aliases',
  description: 'List all current expected members and their aliases',
  execute(message) {
    if (!this.serverDb) {
      throw new Error('Missing ServerDb');
    }
    const expectedNames = dbClient.getExpectedNames(this.serverDb);
    const list = expectedNames.map((person) => {
      const aliasList = person.aliases.join(', ');
      return `**${person.displayName}:** ${aliasList}`;
    });
    message.channel.send(`${list.length ? list.join('\n') : 'No Aliases to show'}`);
  },
};
