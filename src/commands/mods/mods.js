const { RichEmbed } = require('discord.js');
const dbClient = require('../../db/dbClient');

module.exports = {
  name: 'mods',
  description: 'List mod roles',
  execute(message) {
    if (!this.serverDb) {
      throw new Error('Missing ServerDb');
    }
    const allowedRoles = dbClient.getAllowedRoles(this.serverDb);

    const roles = allowedRoles.map((roleId) => message.guild.roles.get(roleId));
    const embed = new RichEmbed({
      fields: [{
        name: 'Mod Roles:',
        value: roles.length ? roles.join('\n') : 'No Roles Specified',
      }],
    });
    message.channel.send(embed);
  },
};
