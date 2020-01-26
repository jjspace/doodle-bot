const axios = require('axios');
const logger = require('./logger');

const apiBase = 'https://doodle.com/api/v2.0';

// utility to extract id from full url if needed
module.exports.extractId = (idStr) => {
  // sample url: https://doodle.com/poll/3n8yb2aqzhc4ystg
  const id = idStr.match(/[a-z0-9]+$/);
  return id ? id[0] : null;
};

module.exports.getDoodle = async (pollId) => axios
  .get(`${apiBase}/polls/${pollId}`)
  .then((response) => response.data)
  .catch((error) => {
    logger.error('doodle-api getDoodle: ', error);
    throw error;
  });

module.exports.getDoodles = async (idList) => Promise
  .allSettled(idList.map((pollId) => axios.get(`${apiBase}/polls/${pollId}`)))
  .then((responses) => {
    logger.info('doodle-api getDoodles: ', responses.map((resp) => resp.status));
    return responses;
  })
  .catch((error) => {
    logger.error('doodle-api error: ', error);
    throw error;
  });
