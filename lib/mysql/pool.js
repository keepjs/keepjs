var Promise = require('bluebird'),
    mysql = require('mysql'),
    Connection = require('./connection.js'),
    promiseCallback = require('./helper').promiseCallback;
var _ = require("lodash");

_.dataType = function (data) {
    return toString.call(data).replace(/(\[object\s)|(\])/g, '');
};
var pool = function (config) {
    this.pool = mysql.createPool(config);
};

pool.prototype.getConnection = function getConnection() {
    return promiseCallback.apply(this.pool, ['getConnection', arguments])
        .then(function (con) {
            return new Connection(null, con);
        });
};

pool.prototype.releaseConnection = function releaseConnection(connection) {
    //Use the underlying connection from the mysql-module here:
    return this.pool.releaseConnection(connection.connection);
};

pool.prototype.query = function (sql, values) {
    return promiseCallback.apply(this.pool, ['query', arguments]);
};

pool.prototype.end = function (data) {
    return promiseCallback.apply(this.pool, ['end', arguments]);
};

pool.prototype.escape = function (value) {
    return this.pool.escape(value);
};

pool.prototype.escapeId = function (value) {
    return this.pool.escapeId(value);
};

pool.prototype.on = function (event, fn) {
    this.pool.on(event, fn);
};

pool.prototype.and = function (obj, sql) {
    if(null === sql || undefined === sql){
        new Error("async-mysql add方法输入参数不能为空");
    }
    if (_.dataType(obj) !== 'Object') {
        return '';
    };

    var keyHandlers = {
        'or': function (key) {
            return key.replace(/^(\s+)?AND(\s+)?\`or(\s+)?/gi, ' OR `');
        },
        '.': function (key) {
            return key.replace(/\./g, '`.`');
        },
        '(': function (key) {
            return key.replace(/(\`)?\(/g, '(`');
        },
        '>=': function (key) {
            return key.replace(/(\s+)?\>\=(\s+)?\`/gi, '` >=');
        },
        '<=': function (key) {
            return key.replace(/(\s+)?\<\=(\s+)?\`/gi, '` <=');
        },
        '<>': function (key) {
            return key.replace(/(\s+)?\<\>(\s+)?\`/gi, '` <>');
        },
        '!=': function (key) {
            return key.replace(/(\s+)?\!\=(\s+)?\`/gi, '` !=');
        },
        '>': function (key) {
            return key.replace(/(\s+)?\>(\s+)?\`/gi, '` >');
        },
        '<': function (key) {
            return key.replace(/(\s+)?\<(\s+)?\`/gi, '` <');
        },
        'like': function (key) {
            return key.replace(/(\s+)?like(\s+)?\`/gi, '` LIKE');
        },
        'in': function (key) {
            return key.replace(/(\s+)?in(\s+)?\`/gi, '` IN');
        }
    };

    var res = '';
    _.each(obj, function (value, key, list) {
        var kMatch = key.match(/or|\.|\(|\>\=|\<\=|\<\>|\!\=|\>|\<|like|in/gi);
        var newKey = ' AND `' + key + '`';
        _.each(kMatch, function (v, k, l) {
            newKey = keyHandlers[v.toLowerCase()](newKey);
        });

        var equal = key.match(/\>\=|\<\=|\<\>|\!\=|\>|\<|like|in/gi) ? ' ' : ' = ';
        // var equal = ' = ';

        var newVal = value;
        if (key.match(/like/gi)) {
            newVal = "%" + newVal + "%";
        }
        ;
        if (_.dataType(newVal) !== 'Array') {
            newVal = "'" + newVal + "'";
        } else {
            newVal = "('" + newVal.join("', '") + "')";
        }
        ;
        newVal = newVal.replace(/\)\'/, "')");

        res += newKey + equal + newVal;
    });


    var xx =  res.replace(/^(\s+)?AND/, '');
    return sql.replace("????"," " + xx + " ");

};


pool.prototype.and2 = function (obj, sql) {
    if(null === sql || undefined === sql){
        new Error("async-mysql add方法输入参数不能为空");
    }
    if (_.dataType(obj) !== 'Object') {
        return '';
    };

    var keyHandlers = {
        'or': function (key) {
            return key.replace(/^(\s+)?AND(\s+)?\`or(\s+)?/gi, ' OR `');
        },
        '.': function (key) {
            return key.replace(/\./g, '`.`');
        },
        '(': function (key) {
            return key.replace(/(\`)?\(/g, '(`');
        },
        '>=': function (key) {
            return key.replace(/(\s+)?\>\=(\s+)?\`/gi, '` >=');
        },
        '<=': function (key) {
            return key.replace(/(\s+)?\<\=(\s+)?\`/gi, '` <=');
        },
        '<>': function (key) {
            return key.replace(/(\s+)?\<\>(\s+)?\`/gi, '` <>');
        },
        '!=': function (key) {
            return key.replace(/(\s+)?\!\=(\s+)?\`/gi, '` !=');
        },
        '>': function (key) {
            return key.replace(/(\s+)?\>(\s+)?\`/gi, '` >');
        },
        '<': function (key) {
            return key.replace(/(\s+)?\<(\s+)?\`/gi, '` <');
        },
        'like': function (key) {
            return key.replace(/(\s+)?like(\s+)?\`/gi, '` LIKE');
        },
        'in': function (key) {
            return key.replace(/(\s+)?in(\s+)?\`/gi, '` IN');
        }
    };

    var res = '';
    _.each(obj, function (value, key, list) {
        var kMatch = key.match(/or|\.|\(|\>\=|\<\=|\<\>|\!\=|\>|\<|like|in/gi);
        var newKey = ' AND `' + key + '`';
        _.each(kMatch, function (v, k, l) {
            newKey = keyHandlers[v.toLowerCase()](newKey);
        });

        var equal = key.match(/\>\=|\<\=|\<\>|\!\=|\>|\<|like|in/gi) ? ' ' : ' = ';
        // var equal = ' = ';

        var newVal = value;
        if (key.match(/like/gi)) {
            newVal = "%" + newVal + "%";
        }
        ;
        if (_.dataType(newVal) !== 'Array') {
            newVal = "'" + newVal + "'";
        } else {
            newVal = "('" + newVal.join("', '") + "')";
        }
        ;
        newVal = newVal.replace(/\)\'/, "')");

        res += newKey + equal + newVal;
    });

    var xx =  res.replace(/^(\s+)?AND/, '');
    return sql.replace("????"," " + xx + " ");

};


module.exports = pool;
