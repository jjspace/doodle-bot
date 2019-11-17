const axios = require('axios');
const logger = require('./logger');

const apiBase = 'https://doodle.com/api/v2.0';

module.exports.getDoodle = async (pollId) => axios
  .get(`${apiBase}/polls/${pollId}`)
  .then((resp) => resp.data)
  .catch(logger.error);

module.exports.getDoodles = async (idList) => axios
  .all(idList.map((pollId) => axios.get(`${apiBase}/polls/${pollId}`)))
  .then((responses) => responses.map((resp) => resp.data))
  .catch(logger.error);
