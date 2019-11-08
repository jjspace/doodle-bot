/**
 * A ping pong bot, whenever you send "ping", it replies "pong".
 */

// Import the discord.js module
const Discord = require('discord.js');
const config = require('./config');
const db = require('./db/db').db();
const dbClient = require('./db/dbClient');
const doodleApi = require('./doodle-api');
const doodleParse = require('./doodle-parse');

const { Permissions } = Discord;

const { discordBotToken } = config;

// Create an instance of a Discord client
const client = new Discord.Client();

/**
 * The ready event is vital, it means that only _after_
 * this will your bot start reacting to information
 * received from Discord
 */
client.on('ready', () => {
  console.log('I am ready!');
  if (process.send) {
    // sent 'ready' for pm2
    process.send('ready');
  }
});

client.on('guildCreate', (guild) => {
  console.log('Invited to join new guild');
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
    || member.hasPermission(Permissions.FLAGS.MANAGE_SERVER)) {
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
  const { guild, member, content } = message;

  console.log(`recieved message: "${message.content}" (${message.embeds.length} embeds) from ${member.displayName}`);
  if (message.author === client.user) {
    console.log('message from myself, no action');
    return;
  }
  if (message.author.bot) {
    console.log('message is another bot, ignore');
    return;
  }

  // Load server or generate default server
  const serverDb = dbClient.getServer(db, guild.id);
  if (!serverDb.value()) {
    dbClient.addServer(db, guild.id, guild.name);
    message.channel.send('Current Guild Settings not found, defaults generated\nIf you think this is wrong contact the bot developer');
    return;
  }
  console.log(`Loaded serverDb for guild ${guild.id}`);

  // Check for access to the bot
  const hasAccess = checkAccess(serverDb, member);
  if (!hasAccess) {
    console.log(`Member ${member.displayName} does not have access`);
    return;
  }

  const commandMarker = dbClient.getCommandPrefix(serverDb);

  // Our bot needs to know if it will execute a command
  // It will listen for messages that will start with commandMarker
  if (content.substring(0, 1) === commandMarker) {
    const args = content.substring(1).split(' '); // first word minus marker
    const cmd = args.shift().toLowerCase();

    switch (cmd) {
      case 'ping': {
        message.channel.send('Pong!');
        break;
      }
      case 'members': {
        let secondaryCmd = args.shift();

        // Default alias command is list
        if (!secondaryCmd) secondaryCmd = 'list';

        switch (secondaryCmd) {
          case 'list': {
            const names = dbClient
              .getExpectedNames(serverDb)
              .map(expectedName => expectedName.displayName);
            message.channel.send(`**Members**: ${names.length ? names.join(', ') : 'No members'}`);

            break;
          }
          case 'add': {
            if (args.length !== 1) {
              message.channel.send('Incorrect number of arguments, need one');
              break;
            }
            const newName = args.shift();

            dbClient.addExpectedName(serverDb, {
              displayName: newName,
              aliases: [newName],
            });

            message.channel.send(`"${newName}" added to members`);

            break;
          }
          default:
            break;
        }

        break;
      }
      case 'aliases': {
        let secondaryCmd = args.shift();

        // Default alias command is list
        if (!secondaryCmd) secondaryCmd = 'list';

        switch (secondaryCmd) {
          // alias list - show list of all aliases "Display Name": [aliases]
          case 'list': {
            const expectedNames = dbClient.getExpectedNames(serverDb);
            const list = expectedNames.map((person) => {
              const aliasList = person.aliases.join(', ');
              return `**${person.displayName}:** ${aliasList}`;
            });
            message.channel.send(`${list.length ? list.join('\n') : 'No Aliases to show'}`);
            break;
          }
          // alias add Name Alias - add "Alias" to list of "Name"'s aliases
          case 'add': {
            if (args.length < 2) {
              message.channel.send('Not enough arguments, need at least 2');
              break;
            }
            const displayName = args.shift();
            // TODO: try and turn this into allowing multiple with quotes around ones with spaces
            const newAlias = args.join(' ');

            const expectedName = dbClient.getExpectedName(serverDb, displayName);
            if (expectedName) {
              dbClient.addExpectedNameAlias(serverDb, displayName, [newAlias]);
              message.channel.send(`Alias "${newAlias}" added to display name "${displayName}"`);
            }
            else {
              message.channel.send(`Display Name "${displayName}" not found`);
            }

            break;
          }
          case 'remove': {
            if (args.length !== 2) {
              message.channel.send('Wrong number of arguments, need 2');
              break;
            }

            const displayName = args.shift();
            const aliasToRemove = args.shift();
            const expectedName = dbClient.getExpectedName(serverDb, displayName);
            if (expectedName) {
              dbClient.removeExpectedNameAlias(serverDb, displayName, aliasToRemove);
              message.channel.send(`Alias "${aliasToRemove}" removed from ${displayName}`);
            }
            else {
              message.channel.send(`Display Name "${displayName}" not found`);
            }

            break;
          }
          default:
            break;
        }
        break;
      }
      case 'mods': {
        let secondaryCmd = args.shift();

        if (!secondaryCmd) secondaryCmd = 'list';

        switch (secondaryCmd) {
          case 'list': {
            const allowedRoles = dbClient.getAllowedRoles(serverDb);

            const roles = allowedRoles.map(roleId => guild.roles.get(roleId));
            message.channel.send(`Current Allowed Roles:\n${roles.length ? roles.join('\n') : 'No Roles Specified'}`);

            break;
          }
          case 'add': {
            // add role to moderators
            const mentionedRoles = message.mentions.roles;
            if (mentionedRoles.size !== 1) {
              message.channel.send('Must mention one and only one role to add');
              break;
            }

            const mentionedRole = mentionedRoles.first();
            const roleId = mentionedRole.id;
            const mention = mentionedRole.toString();

            // if allowedRoles is empty and you do not have the role
            // you tried to add, don't allow it

            const currAllowedRoles = dbClient.getAllowedRoles(serverDb);
            if (currAllowedRoles.includes(roleId)) {
              message.channel.send(`${mention} already allowed`);
              break;
            }

            dbClient.addAllowedRole(serverDb, roleId);
            message.channel.send(`Added role ${mention}`);
            break;
          }
          case 'remove': {
            const mentionedRoles = message.mentions.roles;
            if (mentionedRoles.size !== 1) {
              message.channel.send('Must mention one and only one role to remove');
              break;
            }

            const mentionedRole = mentionedRoles.first();
            const roleId = mentionedRole.id;
            const mention = mentionedRole.toString();

            const currAllowedRoles = dbClient.getAllowedRoles(serverDb);
            if (!currAllowedRoles.includes(roleId)) {
              message.channel.send(`${mention} not in list`);
              break;
            }

            dbClient.removeAllowedRole(serverDb, roleId);
            message.channel.send(`Removed role ${mention}`);

            break;
          }

          default:
            break;
        }
        break;
      }
      case 'doodles': {
        let secondaryCmd = args.shift();

        // Default alias command is list
        if (!secondaryCmd) secondaryCmd = 'list';

        switch (secondaryCmd) {
          case 'list': {
            const doodles = dbClient
              .getDoodles(serverDb)
              .map(doodle => `${doodle.name} - ${doodle.id}`);

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
                } catch (error) {
                  if (error.message.includes('duplicate id')) {
                    message.channel.send(`Doodle "${title}" already being tracked`);
                    return;
                  }
                  console.log(error);
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
            } catch (error) {
              console.log(error);
            }

            break;
          }
          case 'report': {
            const doodleIds = args.length > 0
              ? [...args]
              : dbClient
                .getDoodles(serverDb)
                .map(doodle => doodle.id);

            const expectedNames = dbClient
              .getExpectedNames(serverDb)
              .map(name => name.aliases);

            const today = new Date();
            doodleApi.getDoodles(doodleIds)
              .then((doodleDatas) => {
                console.log(doodleDatas.map(resp => `"${resp.title}" data retrieved`).join('\n'));
                const embeds = doodleDatas.map(doodle => doodleParse.doodleToEmbed(doodle, expectedNames));
                message.channel.send(
                  `Daily Doodle Report ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear() % 1000}`,
                );
                embeds.forEach(embed => message.channel.send({ embed }));
              });

            break;
          }
          default:
            break;
        }

        break;
      }
      default: {
        message.channel.send(`Unrecognized command. Use ${commandMarker}help to see available commands`);
        break;
      }
    }
  }
});

// Log our bot in using the token from https://discordapp.com/developers/applications/me
client.login(discordBotToken);

client.on('error', (error) => {
  console.error(error);
});

process.on('SIGINT', () => {
  console.log('Caught interrupt signal');

  client.destroy();
  process.exit();
});
