/**
 * keep
 */
module.exports =  {
    mysql: {
        host: process.env.mysql_host || 'localhost',
        user: process.env.mysql_user || 'root',
        password: process.env.mysql_password || '123',
        database: process.env.mysql_database || 'db',
        port: process.env.mysql_port || 3306,
        connectionLimit: process.env.mysql_connectionLimit || 40,
        supportBigNumbers: true,
        bigNumberStrings: true,
        dateStrings: true
    },

    logger: {
        logDirPath: process.env.log_file || "logs",
        appLogLevel: process.env.log_leavel ||  'debug',
        appName: process.appName || 'keepjs-1.0'
    }


}
