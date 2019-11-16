const path = require('path');
const lowdb = require('lowdb');
const lodashId = require('lodash-id');
const FileSync = require('lowdb/adapters/FileSync');
const Memory = require('lowdb/adapters/Memory');
const logger = require('../logger');
const config = require('../config');

const { dbName } = config;
const dbPath = path.join(__dirname, dbName);

// DB design inspired by: https://saltsthlm.github.io/protips/lowdb.html

module.exports.db = () => {
  logger.info(`opening db at ${dbPath}`);
  const db = lowdb(
    process.env.NODE_ENV === 'test'
      ? new Memory()
      : new FileSync(dbPath),
  );

  db._.mixin(lodashId);

  db.defaults({ servers: [] }).write();

  return db;
};
