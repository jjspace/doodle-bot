module.exports = (commands) => {
  let fullHelpText = '**`help`**\nDisplay this help page\n';
  fullHelpText += commands.map((command) => `**\`${command.name}\`** ${command.usage ? ` - ${command.usage}` : ''}\n${command.description || ''}`).join('\n');

  return {
    name: 'help',
    description: 'Displays help for all commands or a specific command',
    usage: 'help [?command]',
    execute(message, args) {
      if (args.length > 1) {
        message.channel.send('Too many arguments provided');
        return;
      }
      let helpText = fullHelpText;

      const targetCmd = args.shift();
      if (targetCmd) {
        const command = commands.get(targetCmd);
        helpText = `**\`${command.name}\`** ${command.usage ? ` - ${command.usage}` : ''}\n${command.description || ''}`;
      }

      message.channel.send(helpText);
    },
  };
};
