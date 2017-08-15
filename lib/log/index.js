/**
 *
 */
var _ = require("lodash");
var log4js = require('log4js');
var path = require('path');
var fs = require('fs-extra');
var util = require('util');
var _config = require('../config')


// category
const LOG_CATEGORY = {ACCESS: 'acc', OPERATE: 'op', APPLICATION: 'app', SYS: 'sys'};
// log format
const ACCESS_FORMAT = ' :remote-addr - ":method :url HTTP/:http-version" ":user-agent" ":referrer" :status :content-length  :response-time ms';



const DEFAULT_DIR = 'logs';
const DEFAULT_APP_LOG_LEVEL = 'debug';
var DEFAULT_APPNAME = 'AppName';

const LOG_CONFIG = {
    appenders: {
        console: {
            type: 'console',
        },
        acc: {
            type: 'dateFile',
            filename: LOG_CATEGORY.ACCESS,
            maxLogSize: 10 * 1024 * 1024,
            numberBackups: 15,
            category: LOG_CATEGORY.ACCESS,
        },
        op: {
            type: 'dateFile',
            filename: LOG_CATEGORY.OPERATE,
            maxLogSize: 10 * 1024 * 1024,
            numberBackups: 15,
            category: LOG_CATEGORY.OPERATE,
        },
        sys: {
            type: 'dateFile',
            filename: LOG_CATEGORY.SYS,
            maxLogSize: 10 * 1024 * 1024,
            numberBackups: 15,
            category: LOG_CATEGORY.SYS,
        },
        app: {
            type: 'dateFile',
            filename: LOG_CATEGORY.APPLICATION,
            maxLogSize: 10 * 1024 * 1024,
            numberBackups: 15,
            category: LOG_CATEGORY.APPLICATION,
        },
        app_warn: {
            type: 'dateFile',
            filename: LOG_CATEGORY.APPLICATION,
            maxLogSize: 10 * 1024 * 1024,
            numberBackups: 15,
            category: LOG_CATEGORY.APPLICATION,
        },
        app_error:{
            type: 'dateFile',
            filename: LOG_CATEGORY.APPLICATION,
            maxLogSize: 10 * 1024 * 1024,
            numberBackups: 15,
            category: LOG_CATEGORY.APPLICATION
        },
        warn_filter: {
            type: 'logLevelFilter',
            level: 'WARN',
            appender: 'app_error'
        },
        error_filter: {
            type: 'logLevelFilter',
            level: 'ERROR',
            appender: 'app_error'
        }
    },
    "replaceConsole": false,
};

var acc_logger = log4js.getLogger(LOG_CATEGORY.ACCESS);
var op_logger = log4js.getLogger(LOG_CATEGORY.OPERATE);
var app_logger = log4js.getLogger(LOG_CATEGORY.APPLICATION);
var sys_logger = log4js.getLogger(LOG_CATEGORY.SYS);

var logger = app_logger
var ext = {
    op: op_logger,
    acc: acc_logger,
    app: app_logger,
    sys: sys_logger
};
Object.assign(logger,ext)

var hasConfiged = 0;

function checkInit() {
    // if(!app_logger){
    if (hasConfiged == 0) {
        logger.config(_config.logger)
    }
}


function checkLogDirExists(logConfig) {
    for (let category in LOG_CATEGORY) {
        // console.log(logConfig)
        let categoryPath = logConfig.logDirPath + '/' + LOG_CATEGORY[category];
        if (!fs.ensureDir(categoryPath)) {
            fs.mkdirsSync(categoryPath);
        }
    }
}

function combineAppTokens(logObj) {
    let tokens = [];
    tokens.push({token: ':file-name', replacement: logObj.fileName || ''});
    tokens.push({token: ':oper-method', replacement: logObj.methodName || ''});
    tokens.push({token: ':log-msg', replacement: logObj.logMsg || ''});
    tokens.push({token: ':error', replacement: logObj.error || ''});
    return tokens;
}

/**------------------------------------------------------------------ koa */


/**
 * The parameters configuration of the logger
 * @param customConfig
 * @returns {*}
 */
logger.configLogger = function (customConfig) {
    if(hasConfiged == 1 ){
        return
    }

    if(_.isUndefined(customConfig) || _.isNaN(customConfig)){
        var customConfig = {}
    }

    let logConfig = LOG_CONFIG
    let applicationName = DEFAULT_APPNAME
    let logDirPath = DEFAULT_DIR
    let appLogLevel = DEFAULT_DIR
    try{
        applicationName = _.isUndefined(customConfig.appName) ? DEFAULT_APPNAME : customConfig.appName
    }catch (e){
        applicationName = DEFAULT_APPNAME
    }

    try{
        logDirPath = customConfig.logDirPath || DEFAULT_DIR;
        logConfig.logDirPath = logDirPath
    }catch (e){
        logDirPath = DEFAULT_DIR;
        logConfig.logDirPath = logDirPath

    }

    try{
        appLogLevel = customConfig.appLogLevel || DEFAULT_APP_LOG_LEVEL;
    }catch (e){
        appLogLevel = DEFAULT_APP_LOG_LEVEL;
    }


    var keys = Object.keys(logConfig.appenders);
    for (let i = 0; i < keys.length; i++) {
        let obj = logConfig.appenders[keys[i]]


        if (obj.type == 'console') {
            logConfig.appenders[keys[i]].category = ['console', 'acc', 'app', 'sys', 'op']
            logConfig.appenders[keys[i]].layout = configLayout(applicationName)
        }
        if (obj.type == 'dateFile'){

            logConfig.appenders[keys[i]].filename = logDirPath + '/' + logConfig.appenders[keys[i]].filename + "/"
            logConfig.appenders[keys[i]].layout = configLayout(applicationName)
            logConfig.appenders[keys[i]].alwaysIncludePattern = true
            logConfig.appenders[keys[i]].pattern = "/" + keys[i] + ".yyyyMMdd.log"
        }
    }

    logConfig.categories = {
        default: {appenders: ['console', 'acc','app','sys','op'], level: appLogLevel },
    }


    console.log(logConfig)

    checkLogDirExists(logConfig);
    log4js.configure(logConfig);

    hasConfiged = 1;
    console.log("log config finish!")
}

/**
 * koa log middleware
 * @param customLogConfig
 * @returns {function(*=, *)}
 */
logger.config = function (customLogConfig) {
    if(hasConfiged == 1 ){
        return
    }
    // hasConfiged = 1;
    logger.configLogger(customLogConfig)


    // log middleware
    return async (ctx, next) => {
        const start = new Date();
        await next();
        ctx.responseTime = new Date() - start;
        let logLineStr = formatLogContent(ACCESS_FORMAT, combineTokens(ctx));
        if (ctx.res.statusCode >= 400) {
            acc_logger.error(logLineStr);
        } else if (ctx.res.statusCode >= 300) {
            acc_logger.warn(logLineStr);
        } else {
            acc_logger.info(logLineStr);
        }
    }
}



function configLayout(appName) {

    let defaultLayout = {
        type: "pattern",
        pattern: "(%z) [%h] [%d] %[[%p]%] (" + appName + ")[%c] %m",
        tokens: {
            pid: function () {
                return process.pid;
            }
        }
    }

    return defaultLayout
}

function formatLogContent(formatStr, tokens) {
    for (let i = 0; i < tokens.length; i++) {
        formatStr = formatStr.replace(tokens[i].token, tokens[i].replacement);
    }
    return formatStr;
}

/**
 * Parse log tokens.
 * @param ctx Context
 */
function combineTokens(ctx) {
    let tokens = [];
    tokens.push({token: ':date', replacement: new Date().toUTCString()});
    tokens.push({
        token: ':remote-addr', replacement: ctx.headers['x-forwarded-for'] || ctx.ip || ctx.ips ||
        (ctx.socket && (ctx.socket.remoteAddress || (ctx.socket.socket && ctx.socket.socket.remoteAddress)))
    });
    tokens.push({token: ':method', replacement: ctx.method});
    tokens.push({token: ':url', replacement: ctx.originalUrl});
    tokens.push({token: ':http-version', replacement: ctx.req.httpVersionMajor + '.' + ctx.req.httpVersionMinor});
    tokens.push({
        token: ':status',
        replacement: ctx.response.status || ctx.response.__statusCode || ctx.res.statusCode
    });
    tokens.push({
        token: ':content-length', replacement: (ctx.response._headers && ctx.response._headers['content-length']) ||
        (ctx.response.__headers && ctx.response.__headers['Content-Length']) ||
        ctx.response.length || '-'
    });
    tokens.push({token: ':referrer', replacement: ctx.headers.referer || ''});
    tokens.push({token: ':user-agent', replacement: ctx.headers['user-agent']});
    tokens.push({token: ':response-time', replacement: ctx.responseTime});
    return tokens;
}

module.exports = logger;

