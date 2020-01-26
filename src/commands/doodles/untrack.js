const dbClient = require('../../db/dbClient');
const doodleApi = require('../../doodle-api');
const logger = require('../../logger');

module.exports = {
  name: 'untrack',
  description: 'Stop tracking the specified Doodle Poll',
  usage: 'untrack [tracked number | poll id | doodle link]',
  execute(message, args) {
    if (!this.serverDb) {
      throw new Error('Missing ServerDb');
    }
    if (args.length > 1) {
      message.channel.send('Too many arguments provided');
      return;
    }
    if (!args.length) {
      message.channel.send('Must provide doodleId');
      return;
    }

    const doodleId = doodleApi.extractId(args.shift());
    if (!doodleId) {
      message.channel.send('Unknown id, please try again');
      return;
    }

    const idLengthToQualify = 4;
    if (doodleId.length < idLengthToQualify && /^\d+$/.test(doodleId)) {
      // doodleId is index not id, remove by index
      const index = +doodleId - 1; // remove offset

      if (index >= dbClient.getDoodles(this.serverDb).length) {
        message.channel.send(`Doodle "${index}" does not exist`);
      }

      dbClient.removeDoodleByIndex(this.serverDb, index);
      message.channel.send(`No longer tracking doodle "${doodleId}"`);
      return;
    }

    // doodleId is actual id, try remove by id
    const doodleToRemove = dbClient.getDoodle(this.serverDb, doodleId);
    if (!doodleToRemove) {
      message.channel.send(`No poll with id "${doodleId}" currently being tracked`);
      return;
    }
    try {
      dbClient.removeDoodle(this.serverDb, doodleId);
      message.channel.send(`No longer tracking doodle "${doodleToRemove.name}"`);
    }
    catch (error) {
      logger.error(error);
    }
  },
};
