const axios = require('axios');

const apiBase = 'https://doodle.com/api/v2.0';

module.exports.getDoodle = async (pollId) => {
  return axios.get(`${apiBase}/polls/${pollId}`)
    .then(resp => resp.data)
    .catch(console.error);
};

module.exports.getDoodles = async (idList) => {
  return axios
    .all(idList.map(pollId => axios.get(`${apiBase}/polls/${pollId}`)))
    .then(responses => responses.map(resp => resp.data))
    .catch(console.error);
};
