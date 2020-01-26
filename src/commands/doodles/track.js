const dbClient = require('../../db/dbClient');
const doodleApi = require('../../doodle-api');
const logger = require('../../logger');

module.exports = {
  name: 'track',
  description: 'Start tracking the provided Doodle Poll',
  usage: 'track [poll id | doodle link]',
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

    // get doodle info
    doodleApi.getDoodle(doodleId)
      .then((doodleData) => {
        const { title } = doodleData;

        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 7);

        try {
          dbClient.addDoodle(this.serverDb, {
            id: doodleId,
            name: title,
            deadline: deadline.toJSON(),
          });
          message.channel.send(`Started tracking doodle "${title}"`);
        }
        catch (error) {
          if (error.message.includes('duplicate id')) {
            message.channel.send(`Doodle "${title}" already being tracked`);
            return;
          }
          logger.error(error);
        }
      })
      .catch(() => {
        message.channel.send(`Doodle id "${doodleId}" not found. Please check you copied it correctly.`);
      });
  },
};
