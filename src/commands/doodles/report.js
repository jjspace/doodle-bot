const dbClient = require('../../db/dbClient');
const doodleApi = require('../../doodle-api');
const doodleParse = require('../../doodle-parse');
const logger = require('../../logger');


module.exports = {
  name: 'report',
  description: 'Display the current results of all tracked polls or a specified one',
  usage: 'report [?poll id | doodle link]',
  execute(message, args) {
    if (!this.serverDb) {
      throw new Error('Missing ServerDb');
    }
    const doodleIds = args.length > 0
      ? [...args].map(doodleApi.extractId)
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
        const embeds = doodleDatas.map((doodle, i) => {
          if (doodle.status === 'rejected') {
            const { reason: { request, response } } = doodle;
            const doodleId = doodleApi.extractId(request.path);
            let desc = 'Problem retrieving this doodle\'s data';
            if (response.status === 410) {
              logger.info(`Doodle (${doodleId}) was deleted, informing user to untrack`);
              desc = 'This poll has been deleted, please untrack it';
            }
            else if (response.status === 404) {
              logger.info(`Doodle (${doodleId}) doesn't/never exist(ed), notifying user of issue`);
              desc = 'Problem retrieving this doodle\'s data. It seems like a doodle with this id never existed';
            }
            else {
              logger.error(`Doodle (${doodleId}) failed with status ${response.status}. Unknown failure, no action`);
            }
            return {
              title: `**Doodle ${i + 1}** (${doodleId})`,
              description: desc,
            };
          }
          const doodleData = doodle.value.data;
          logger.info(`"${doodleData.title}" data retrieved`);
          // TODO: add doodle data
          // logger.data({ doodle });
          return doodleParse.doodleToEmbed(doodleData, expectedNames);
        });
        message.channel.send(
          `Daily Doodle Report ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear() % 1000}`,
        );
        embeds.forEach((embed) => message.channel.send({ embed }));
        logger.info('=====Report Sent=====');
      })
      .catch((error) => {
        const { response } = error;
        if (response && response.status === 410) {
          // one of the tracked polls has been deleted
          message.channel.send('There was an error generating the report. Looks like one of the tracked polls has been deleted. Please remove it and try again.');
          return;
        }
        message.channel.send('There was an error generating the report. Please try again later or contact the developer');
      });
  },
};
