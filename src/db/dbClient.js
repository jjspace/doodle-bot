
// client design inspired by: https://saltsthlm.github.io/protips/lowdb.html

module.exports.getServer = (db, serverId) => {
  return db.get('servers').getById(serverId);
};

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
  db.get('servers').insert(newServer);
};

module.exports.getCommandPrefix = (serverDb) => {
  return serverDb.get('commandPrefix').value();
};

module.exports.getAllowedRoles = (serverDb) => {
  return serverDb.get('allowedRoles').value();
};

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


module.exports.getExpectedName = (serverDb, displayName) => {
  return serverDb.get('expectedNames').find({ displayName }).value();
};
module.exports.getExpectedNames = (serverDb) => {
  return serverDb.get('expectedNames').value();
};

module.exports.addExpectedName = (serverDb, newName) => {
  serverDb.get('expectedNames')
    .insert(newName)
    .write();
}

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

module.exports.getDoodles = (serverDb) => {
  return serverDb.get('doodlesToWatch').value();
};

module.exports.getDoodle = (serverDb, pollId) => {
  return serverDb
    .get('doodlesToWatch')
    .getById(pollId)
    .value();
};

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
