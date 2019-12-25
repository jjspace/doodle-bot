const Discord = require('discord.js');
const commands = require('./commands');
const config = require('./config');
const logger = require('./logger');
const db = require('./db/db').db();
const dbClient = require('./db/dbClient');
const doodleApi = require('./doodle-api');
const doodleParse = require('./doodle-parse');

const { Permissions } = Discord;

const { discordBotToken } = config;

// Create an instance of a Discord client
const client = new Discord.Client();
client.commands = commands;

/**
 * The ready event is vital, it means that only _after_
 * this will your bot start reacting to information
 * received from Discord
 */
client.once('ready', () => {
  logger.info(`I am ready! I am "${client.user.username}" connected to ${client.guilds.size} guilds`);
  if (process.send) {
    // sent 'ready' for pm2
    process.send('ready');
  }
});

client.on('guildCreate', (guild) => {
  logger.info(`Invited to join new guild: ${guild.id}`);
  if (guild.available) {
    // It's recommended to see if a guild is available before
    // performing operations or reading data from it. You can
    // check this with `guild.available`.
    // guild.available indicates server outage

    const { id, name } = guild;

    const storedGuild = dbClient.getServer(db, id);

    if (!storedGuild.value()) {
      dbClient.addServer(db, id, name);
    }
  }
});

const checkAccess = (serverDb, member) => {
  // allow anyone with Admin or Manage Server permissions
  // regardless of role
  if (member.hasPermission(Permissions.FLAGS.ADMINISTRATOR)
    || member.hasPermission(Permissions.FLAGS.MANAGE_GUILD)) {
    return true;
  }

  const allowedRoles = dbClient.getAllowedRoles(serverDb);

  const allowed = allowedRoles
    .reduce((acc, roleId) => acc || member.roles.has(roleId), false);
  return allowed;
};

// Create an event listener for messages
// client.on('message', (user, userID, channelID, message, evt) => {
client.on('message', (message) => {
  const {
    guild,
    author,
    member,
    content,
  } = message;

  logger.info(`Received message: "${message.content}" (${message.embeds.length} embeds) from "${author.username || ''}:${author.id}"`);
  if (message.author === client.user) {
    logger.info('Message from myself, no action');
    return;
  }
  if (message.author.bot) {
    logger.info('Message from another bot, ignore');
    return;
  }
  if (message.guild === null) {
    // dm not a guild
    logger.info('Message was a DM, alert and ignore');
    message.channel.send('This bot does not currently accept DMs');
    return;
  }

  // Load server or generate default server
  const serverDb = dbClient.getServer(db, guild.id);
  if (!serverDb.value()) {
    dbClient.addServer(db, guild.id, guild.name);
    message.channel.send('Current Guild Settings not found, defaults generated\nIf you think this is wrong contact the bot developer');
    return;
  }
  logger.info(`Loaded serverDb for guild ${guild.id}`);

  // Check for access to the bot
  const hasAccess = checkAccess(serverDb, member);
  if (!hasAccess) {
    logger.info(`Member "${member.displayName || member.id}" does not have access`);
    return;
  }

  const commandPrefix = dbClient.getCommandPrefix(serverDb);

  // Our bot needs to know if it will execute a command
  // It will listen for messages that will start with commandMarker
  if (content.startsWith(commandPrefix)) {
    const args = content.slice(commandPrefix.length).split(/\s+/); // first word minus marker
    const commandName = args.shift().toLowerCase();

    if (!client.commands.has(commandName)) return;
    const command = client.commands.get(commandName);

    // if (command.args && !args.length) {
    //   message.channel.send(`You didn't provide any arguments, ${message.author}!`);
    //   return;
    // }

    try {
      command.serverDb = serverDb;
      command.execute(message, args);
      return;
    }
    catch (error) {
      logger.error(error);
      message.reply('There was an error trying to execute that command!');
    }

    switch (commandName) {
      case 'doodles': {
        let secondaryCmd = args.shift();

        // Default alias command is list
        if (!secondaryCmd) secondaryCmd = 'list';

        switch (secondaryCmd) {
          case 'list': {
            const doodles = dbClient
              .getDoodles(serverDb)
              .map((doodle) => `${doodle.name} - ${doodle.id}`);

            message.channel.send(doodles.length ? doodles.join('\n') : 'No Doodles being tracked');

            break;
          }
          case 'add': {
            if (args.length > 1) {
              message.channel.send('Too many arguments provided');
              break;
            }
            const doodleId = args.shift();
            // get doodle info
            doodleApi.getDoodle(doodleId)
              .then((doodleData) => {
                const { title } = doodleData;

                const deadline = new Date();
                deadline.setDate(deadline.getDate() + 7);

                try {
                  dbClient.addDoodle(serverDb, {
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
              });

            break;
          }
          case 'remove': {
            if (args.length > 1) {
              message.channel.send('Too many arguments provided');
              break;
            }
            const pollId = args.shift();
            // get doodle info

            const doodleToRemove = dbClient.getDoodle(serverDb, pollId);
            if (!doodleToRemove) {
              message.channel.send(`No poll with id "${pollId}" currently being tracked`);
              break;
            }
            try {
              dbClient.removeDoodle(serverDb, pollId);
              message.channel.send(`No longer tracking doodle "${doodleToRemove.name}"`);
            }
            catch (error) {
              logger.error(error);
            }

            break;
          }
          case 'report': {
            const doodleIds = args.length > 0
              ? [...args]
              : dbClient
                .getDoodles(serverDb)
                .map((doodle) => doodle.id);

            const expectedNames = dbClient
              .getExpectedNames(serverDb)
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

            break;
          }
          default:
            break;
        }

        break;
      }
      default: {
        message.channel.send(`Unrecognized command. Use ${commandPrefix}help to see available commands`);
        break;
      }
    }
  }
});

// Log our bot in using the token from https://discordapp.com/developers/applications/me
client.login(discordBotToken);

client.on('error', (error) => {
  logger.error(error);
});

process.on('SIGINT', () => {
  logger.info('Caught Interrupt Signal, quitting');

  client.destroy();
  process.exit();
});
