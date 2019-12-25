const dbClient = require('../../db/dbClient');
const logger = require('../../logger');

module.exports = {
  name: 'untrack',
  description: 'Stop tracking the specified Doodle Poll',
  usage: 'untrack [poll id]',
  execute(message, args) {
    if (!this.serverDb) {
      throw new Error('Missing ServerDb');
    }
    if (args.length > 1) {
      message.channel.send('Too many arguments provided');
      return;
    }
    const pollId = args.shift();
    // get doodle info

    const doodleToRemove = dbClient.getDoodle(this.serverDb, pollId);
    if (!doodleToRemove) {
      message.channel.send(`No poll with id "${pollId}" currently being tracked`);
      return;
    }
    try {
      dbClient.removeDoodle(this.serverDb, pollId);
      message.channel.send(`No longer tracking doodle "${doodleToRemove.name}"`);
    }
    catch (error) {
      logger.error(error);
    }
  },
};
