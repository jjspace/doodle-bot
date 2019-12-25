module.exports = {
  name: 'ping',
  aliases: ['p'],
  description: 'Ping Pong response to check is bot is alive',
  execute(message) {
    message.channel.send('Pong');
  },
};
