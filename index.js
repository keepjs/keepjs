/**
 * keep
 * @type {connection}
 */
var Pool = require('./lib/mysql/pool.js');
var mysql = require('mysql');
var logger = require('./lib/log');

module.exports = {
    mysql:{

        createPool: function(config){
            return new Pool(config);
        },
        Types: mysql.Types,
        escape: mysql.escape,
        escapeId: mysql.escapeId,
        format: mysql.format
    },
    logger: logger
}
