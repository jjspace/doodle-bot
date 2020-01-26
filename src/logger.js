// logger.js
const { createLogger, format, transports } = require('winston');
const { logFileName } = require('./config');

// logger structure inspired by: https://github.com/winstonjs/winston/issues/1275#issuecomment-397504701

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  defaultMeta: { },
  transports: [
    //
    // - Write to all logs with level `info` and below to `quick-start-combined.log`.
    // - Write all logs error (and below) to `quick-start-error.log`.
    //
    new transports.File({ filename: `${logFileName}-error.log`, level: 'error' }),
    new transports.File({ filename: `${logFileName}-combined.log` }),
  ],
});

// mimic format.simple but add timestamp to the front
const timestampSimple = format.printf(({
  timestamp, level, message, ...rest
}) => {
  const stringifiedRest = JSON.stringify(rest);
  if (stringifiedRest !== '{}') {
    return `${timestamp} ${level}: ${message} ${stringifiedRest}`;
  }
  return `${timestamp} ${level}: ${message}`;
});

//
// If we're not in production then **ALSO** log to the `console`
// with the colorized simple format.
//
// if (process.env.NODE_ENV !== 'production') {
logger.add(new transports.Console({
  format: format.combine(
    format.timestamp(),
    format.colorize(),
    timestampSimple,
  ),
}));
// }

module.exports = logger;
