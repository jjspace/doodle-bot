
// client design inspired by: https://saltsthlm.github.io/protips/lowdb.html

module.exports.getServer = (db, serverId) => db.get('servers').getById(serverId);

module.exports.addServer = (db, serverId, serverName) => {
  // TODO: Extract these defaults to config?
  const newServer = {
    id: serverId,
    name: serverName,
    commandPrefix: '!',
    showEmotes: true,
    thresholds: [0.9, 0.6, 0.4],
    colors: [0x43B581, 0xFAA61A, 0xF04747],
    allowedRoles: [],
    expectedNames: [],
    doodlesToWatch: [],
  };
  db.get('servers').insert(newServer).write();
};

module.exports.getCommandPrefix = (serverDb) => serverDb.get('commandPrefix').value();

module.exports.getAllowedRoles = (serverDb) => serverDb.get('allowedRoles').value();

module.exports.addAllowedRole = (serverDb, newRole) => {
  serverDb
    .get('allowedRoles')
    .upsert(newRole)
    .write();
};

module.exports.removeAllowedRole = (serverDb, roleId) => {
  serverDb.get('allowedRoles')
    .pull(roleId)
    .write();
};


module.exports.getExpectedName = (serverDb, displayName) => serverDb.get('expectedNames').find({ displayName }).value();
module.exports.getExpectedNames = (serverDb) => serverDb.get('expectedNames').value();

module.exports.addExpectedName = (serverDb, newName) => {
  serverDb.get('expectedNames')
    .insert(newName)
    .write();
};
module.exports.removeExpectedName = (serverDb, displayName) => {
  serverDb.get('expectedNames')
    .remove({ displayName })
    .write();
};

module.exports.addExpectedNameAlias = (serverDb, displayName, newAliases) => {
  let aliases = serverDb.get('expectedNames')
    .find({ displayName })
    .get('aliases')
    .value();

  aliases = aliases.concat(newAliases);

  serverDb.get('expectedNames')
    .find({ displayName })
    .assign({ aliases })
    .write();
};

module.exports.removeExpectedNameAlias = (serverDb, displayName, oldAlias) => {
  serverDb.get('expectedNames')
    .find({ displayName })
    .get('aliases')
    .pull(oldAlias)
    .write();
};

module.exports.getDoodles = (serverDb) => serverDb.get('doodlesToWatch').value();

module.exports.getDoodle = (serverDb, pollId) => serverDb
  .get('doodlesToWatch')
  .getById(pollId)
  .value();

module.exports.addDoodle = (serverDb, doodle) => {
  serverDb
    .get('doodlesToWatch')
    .insert(doodle)
    .write();
};

module.exports.removeDoodle = (serverDb, pollId) => {
  serverDb
    .get('doodlesToWatch')
    .remove({ id: pollId })
    .write();
};
module.exports.removeDoodleByIndex = (serverDb, index) => serverDb.get('doodlesToWatch').splice(index, 1).write();
