const Discord = require('discord.js');
const commands = require('./commands');
const config = require('./config');
const logger = require('./logger');
const db = require('./db/db').db();
const dbClient = require('./db/dbClient');

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

    if (!client.commands.has(commandName)) {
      message.channel.send(`Unrecognized command. Use ${commandPrefix}help to see available commands`);
      return;
    }
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
