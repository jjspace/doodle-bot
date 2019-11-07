const path = require('path');
const low = require('lowdb');
const lodashId = require('lodash-id');
const FileSync = require('lowdb/adapters/FileSync');
const Memory = require('lowdb/adapters/Memory');
const config = require('../config');

const { dbName } = config;
const dbPath = path.join(__dirname, dbName);

// DB design inspired by: https://saltsthlm.github.io/protips/lowdb.html

module.exports.db = () => {
  console.log('open db at', dbPath);
  const db = low(
    process.env.NODE_ENV === 'test'
      ? new Memory()
      : new FileSync(dbPath),
  );

  db._.mixin(lodashId);

  db.defaults({ servers: [] }).write();

  return db;
};
