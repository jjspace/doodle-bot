const dbClient = require('../../db/dbClient');
const doodleApi = require('../../doodle-api');
const doodleParse = require('../../doodle-parse');
const logger = require('../../logger');


module.exports = {
  name: 'report',
  description: 'Display the current results of all tracked polls or a specified one',
  usage: 'report [?poll id]',
  execute(message, args) {
    if (!this.serverDb) {
      throw new Error('Missing ServerDb');
    }
    const doodleIds = args.length > 0
      ? [...args]
      : dbClient
        .getDoodles(this.serverDb)
        .map((doodle) => doodle.id);

    const expectedNames = dbClient
      .getExpectedNames(this.serverDb)
      .map((name) => name.aliases);

    logger.info('=====Generating Report=====');
    const today = new Date();
    doodleApi.getDoodles(doodleIds)
      .then((doodleDatas) => {
        const embeds = doodleDatas.map((doodle) => {
          logger.info(`"${doodle.title}" data retrieved`);
          // TODO: add doodle data
          // logger.data({ doodle });
          return doodleParse.doodleToEmbed(doodle, expectedNames);
        });
        message.channel.send(
          `Daily Doodle Report ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear() % 1000}`,
        );
        embeds.forEach((embed) => message.channel.send({ embed }));
        logger.info('=====Report Sent=====');
      });
  },
};
