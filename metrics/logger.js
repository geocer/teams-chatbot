const {
    createLogger,
    format,
    transports
} = require('winston');

const LOG_LEVEL = process.env.LOG_LEVEL || 'debug';

const logger = createLogger({
    level: LOG_LEVEL,
    transports: [new transports.Console({
        json: true
    })],
    exitOnError: false
});

module.exports = logger
