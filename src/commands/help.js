module.exports = (commands) => {
  let helptext = '**`help`**\nDisplay this help page\n';
  helptext += commands.map((command) => `**\`${command.name}\`** ${command.usage ? ` - ${command.usage}` : ''}\n${command.description || ''}`).join('\n');

  return {
    name: 'help',
    description: 'Displays help for all commands or a specific command',
    execute(message) {
      message.channel.send(helptext);
    },
  };
};
