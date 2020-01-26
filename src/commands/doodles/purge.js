const dbClient = require('../../db/dbClient');
const doodleApi = require('../../doodle-api');
const logger = require('../../logger');

module.exports = {
  name: 'purge',
  description: 'Untrack doodles that no longer exist. Add argument "closed" to untrack closed doodles too.',
  usage: 'purge [?"closed"]',
  execute(message, args) {
    if (!this.serverDb) {
      throw new Error('Missing ServerDb');
    }
    if (args.length > 1) {
      message.channel.send('Too many arguments provided');
      return;
    }

    const removeClosed = args.shift() === 'closed';

    const doodleIds = dbClient
      .getDoodles(this.serverDb)
      .map((doodle) => doodle.id);

    doodleApi.getDoodles(doodleIds)
      .then((doodleDatas) => {
        let doodlesRemoved = 0;

        doodleDatas.forEach((doodle) => {
          if (doodle.status === 'rejected') {
            const { reason: { request, response } } = doodle;
            const doodleId = doodleApi.extractId(request.path);

            if (response.status === 410) {
              logger.info(`Doodle (${doodleId}) has been deleted, removing from DB`);
              try {
                dbClient.removeDoodle(this.serverDb, doodleId);
                doodlesRemoved += 1;
              }
              catch (error) {
                logger.error(error);
              }
            }
          }
          if (removeClosed) {
            const { id: doodleId, state } = doodle.value.data;
            if (state === 'CLOSED') {
              logger.info(`Doodle (${doodleId}) exists but is CLOSED and should be purged`);
              try {
                dbClient.removeDoodle(this.serverDb, doodleId);
                doodlesRemoved += 1;
              }
              catch (error) {
                logger.error(error);
              }
            }
          }
        });
        message.channel.send(`${doodlesRemoved} doodles have been untracked`);
      })
      .catch(() => {
        message.channel.send('There was a problem purging the tracked doodles. Please try again later or contact the developer');
      });
  },
};
