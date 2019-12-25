
const Discord = require('discord.js');
const ping = require('./ping');
const helpGen = require('./help');
const members = require('./members/members');
const addmember = require('./members/addmember');
const delmember = require('./members/delmember');
const mods = require('./mods/mods');
const addmod = require('./mods/addmod');
const delmod = require('./mods/delmod');
const aliases = require('./aliases/aliases');
const addalias = require('./aliases/addalias');
const delalias = require('./aliases/delalias');
const doodles = require('./doodles/doodles');
const track = require('./doodles/track');
const untrack = require('./doodles/untrack');
const report = require('./doodles/report');

const commands = new Discord.Collection();

commands.set(ping.name, ping);
commands.set(members.name, members);
commands.set(addmember.name, addmember);
commands.set(delmember.name, delmember);
commands.set(mods.name, mods);
commands.set(addmod.name, addmod);
commands.set(delmod.name, delmod);
commands.set(aliases.name, aliases);
commands.set(addalias.name, addalias);
commands.set(delalias.name, delalias);
commands.set(doodles.name, doodles);
commands.set(track.name, track);
commands.set(untrack.name, untrack);
commands.set(report.name, report);

// Generate help command from command definitions
const help = helpGen(commands);
commands.set(help.name, help);

module.exports = commands;
