/* eslint-disable brace-style */

const axios = require('axios');
const { discordWebhookUrl, doodles, expectedNames } = require('./config.js');

const apiBase = 'https://doodle.com/api/v2.0';

const PREF_TYPES = {
  YESNO: 'YESNO',
  YESNOIFNEEDBE: 'YESNOIFNEEDBE',
};

const COLORS = {
  GREEN: 0x43B581,
  YELLOW: 0xFAA61A,
  RED: 0xF04747,
};
const ANSWERED_THRESHOLDS = {
  GOOD: 0.9,
  MEDIUM: 0.6,
  BAD: 0.4,
};

const SHOW_EMOTES = true;
const EMOTES = {
  YES: ':white_check_mark:',
  NO: ':no_entry:',
  MAYBE: ':warning:',
  UNANSWERED: ':bangbang:',
};

const MAX_OPTIONS = 3;

// https://birdie0.github.io/discord-webhooks-guide/other/field_limits.html
const LIMITS = {
  USERNAME: 32,
  CONTENT: 2000,
  EMBEDS: 10,
  FILE: 10,
  TITLE: 256,
  DESCRIPTION: 2048,
  AUTHOR_NAME: 256,
  FIELDS: 25,
  FIELD_NAME: 256,
  FIELD_VALUE: 1024,
  FOOTER_TEXT: 2048,
  SUM_CHAR_IN_EMBED: 6000,
};


const formatDateRange = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const startFormat = {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  };
  const endFormat = {
    hour: 'numeric',
    minute: '2-digit',
  };
  return `${startDate.toLocaleDateString('us', startFormat)} - ${endDate.toLocaleTimeString('us', endFormat)}`;
};

/**
 * Remove punctuation and extra characters from participant names
 *
 * @param {String} name name to clean
 */
const cleanName = name => name.replace(/[^A-Za-z\s]/g, '').trim();

/**
 * Replace participants names with normalized ones from expected aliases
 *
 * @param {Array} participants participants from api call
 */
const normalizeParticipants = (participants) => {
  const normalized = participants.map((participant) => {
    const { name } = participant;
    // find an alias list with a matching participant name
    const aliasList = expectedNames.find((aliases) => {
      return aliases.map(alias => alias.toLowerCase()).includes(cleanName(name).toLowerCase());
    });
    // map current participant to participant with normalized name
    return { ...participant, name: aliasList[0] || name };
  });
  // console.log('normalized participants', normalized)
  return normalized;
};

// eslint-disable-next-line arrow-body-style
const checkExpectedParticipants = (participants, expected) => {
  return expected.map((aliases) => {
    const cleanPartiNames = participants.map(parti => parti.name.toLowerCase()).map(cleanName);
    // console.log('clean names', cleanPartiNames);
    return [
      aliases[0],
      aliases.reduce((acc, alias) => acc || cleanPartiNames.includes(alias.toLowerCase()), false),
    ];
  });
};

const generateYesField = (participants, options, preferencesType) => {
  let output = '';
  options.forEach((option, i) => {
    const filteredParticipants = participants.filter((parti) => {
      if (preferencesType === PREF_TYPES.YESNO) {
        return parti.preferences[i] === 1;
      }
      if (preferencesType === PREF_TYPES.YESNOIFNEEDBE) {
        return parti.preferences[i] === 2;
      }
      throw new Error(`Unknown preferencesType: ${preferencesType}`);
    }).map(parti => parti.name).sort();
    output += `__${formatDateRange(option.start, option.end)}__ (${filteredParticipants.length}): ${filteredParticipants.join(', ')}\n`;
  });
  if (output.length > LIMITS.FIELD_VALUE || options.length > MAX_OPTIONS) {
    output = 'Too many options to display, see full poll for results';
  }
  return {
    name: `${SHOW_EMOTES ? EMOTES.YES : ''} Yes`,
    value: output,
  };
};
const generateMaybeField = (participants, options, preferencesType) => {
  let output = '';
  options.forEach((option, i) => {
    const filteredParticipants = participants.filter((parti) => {
      if (preferencesType === PREF_TYPES.YESNO) {
        return false; // if not in Maybe preference Type mode filter ALL out
      }
      if (preferencesType === PREF_TYPES.YESNOIFNEEDBE) {
        return parti.preferences[i] === 1;
      }
      throw new Error(`Unknown preferencesType: ${preferencesType}`);
    }).map(parti => parti.name).sort();
    output += `__${formatDateRange(option.start, option.end)}__ (${filteredParticipants.length}): ${filteredParticipants.join(', ')}\n`;
  });
  if (output.length > LIMITS.FIELD_VALUE || options.length > MAX_OPTIONS) {
    output = 'Too many options to display, see full poll for results';
  }
  return {
    name: `${SHOW_EMOTES ? EMOTES.MAYBE : ''} Maybe`,
    value: output,
  };
};
const generateNoField = (participants, options) => {
  let output = '';
  options.forEach((option, i) => {
    const filteredParticipants = participants
      .filter(parti => parti.preferences[i] === 0)
      .map(parti => parti.name)
      .sort();
    output += `__${formatDateRange(option.start, option.end)}__ (${filteredParticipants.length}): ${filteredParticipants.join(', ')}\n`;
  });
  if (output.length > LIMITS.FIELD_VALUE || options.length > MAX_OPTIONS) {
    output = 'Too many options to display, see full poll for results';
  }
  return {
    name: `${SHOW_EMOTES ? EMOTES.NO : ''} No`,
    value: output,
  };
};


const doodleToEmbed = (doodle) => {
  const {
    id, title, participants, participantsCount, preferencesType, options,
  } = doodle;

  const normalizedParticipants = normalizeParticipants(participants);

  const fields = [];
  if (options.length > MAX_OPTIONS) {
    fields.push({
      name: `${SHOW_EMOTES ? EMOTES.YES : ''} Yes / ${SHOW_EMOTES ? EMOTES.NO : ''} No / ${SHOW_EMOTES ? EMOTES.MAYBE : ''} Maybe`,
      value: 'Too many options to display, see full poll for results',
    });
    const names = normalizedParticipants.map(parti => parti.name).sort();
    fields.push({
      name: 'All participants',
      value: names.join(', '),
    });
  }
  else {
    fields.push(generateYesField(normalizedParticipants, options, preferencesType));
    fields.push(generateNoField(normalizedParticipants, options));
    fields.push(generateMaybeField(normalizedParticipants, options, preferencesType));
  }
  const expectedStatuses = checkExpectedParticipants(normalizedParticipants, expectedNames);
  const notAnswered = expectedStatuses.filter(status => !status[1]).map(status => status[0]);
  if (notAnswered.length) {
    fields.push({
      name: `${SHOW_EMOTES ? EMOTES.UNANSWERED : ''} **Unanswered**`,
      value: notAnswered.join(', '),
    });
  }

  const ratioAnswered = (expectedStatuses.length - notAnswered.length) / expectedStatuses.length;
  let color = COLORS.GREEN;
  if (ratioAnswered < ANSWERED_THRESHOLDS.GOOD) {
    color = COLORS.YELLOW;
  }
  if (ratioAnswered < ANSWERED_THRESHOLDS.MEDIUM) {
    color = COLORS.RED;
  }

  return {
    title: `**${title}**`,
    url: `https://doodle.com/poll/${id}`,
    description: `${participantsCount} participants`,
    fields,
    color,
  };
};

axios.all(doodles.map(([, pollId]) => axios.get(`${apiBase}/polls/${pollId}`)))
  .then(responses => responses.map(resp => resp.data))
  .then((responses) => {
    console.log(responses.map(resp => `${resp.title} data retrieved`).join('\n'));
    const today = new Date();
    axios.post(discordWebhookUrl, {
      content: `Daily Doodle Report ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear() % 1000}`,
      embeds: responses.map(doodleToEmbed),
    })
      .then((postresp) => {
        console.log('discord post status', postresp.status);
      })
      .catch((error) => {
        console.error(error.response);
      });
  })
  .catch(console.error);
