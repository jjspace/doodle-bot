const dbClient = require('../../db/dbClient');

module.exports = {
  name: 'addmod',
  description: 'Add mod role',
  usage: 'addmod [roleMention]',
  execute(message) {
    if (!this.serverDb) {
      throw new Error('Missing ServerDb');
    }
    // TODO: make more lenient with plaintext args for role names
    //       check against message.guild.roles for valid role name
    const mentionedRoles = message.mentions.roles;
    if (mentionedRoles.size !== 1) {
      message.channel.send('Must mention one and only one role to add');
      return;
    }

    const mentionedRole = mentionedRoles.first();
    const roleId = mentionedRole.id;
    const mention = mentionedRole.toString();

    // if allowedRoles is empty and you do not have the role
    // you tried to add, don't allow it

    const currAllowedRoles = dbClient.getAllowedRoles(this.serverDb);
    if (currAllowedRoles.includes(roleId)) {
      message.channel.send(`${mention} already allowed`);
      return;
    }

    dbClient.addAllowedRole(this.serverDb, roleId);
    message.channel.send(`Added role ${mention}`);
  },
};
