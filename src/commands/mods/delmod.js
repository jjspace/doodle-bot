const dbClient = require('../../db/dbClient');

module.exports = {
  name: 'delmod',
  description: 'Remove mod role',
  usage: 'delmod [roleMention]',
  execute(message) {
    if (!this.serverDb) {
      throw new Error('Missing ServerDb');
    }
    // TODO: make more lenient with plaintext args for role names
    //       check against message.guild.roles for valid role name
    const mentionedRoles = message.mentions.roles;
    if (mentionedRoles.size !== 1) {
      message.channel.send('Must mention one and only one role to remove');
      return;
    }

    const mentionedRole = mentionedRoles.first();
    const roleId = mentionedRole.id;
    const mention = mentionedRole.toString();

    const currAllowedRoles = dbClient.getAllowedRoles(this.serverDb);
    if (!currAllowedRoles.includes(roleId)) {
      message.channel.send(`${mention} not in list`);
      return;
    }

    dbClient.removeAllowedRole(this.serverDb, roleId);
    message.channel.send(`Removed role ${mention}`);
  },
};
