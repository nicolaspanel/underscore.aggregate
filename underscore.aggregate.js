'use strict';

(function() {

    _.mixin({
        aggregate: function(array, pipeline){
            var values = array || [];
            _(pipeline).each(function(pipe){
                var key = _.keys(pipe)[0];
                if (!key){
                    throw Error('Invalid pipe : ' + JSON.stringify(pipe));
                }
                switch (key){
                    case '$project':
                    case '$map':
                        values = $project(values, pipe[key]);
                        break;
                    case '$group':
                        values = $group(values, pipe[key]);
                        break;
                    case '$match':
                    case '$filter':
                    case '$where':
                        values = $match(values, pipe[key]);
                        break;
                    case '$skip':
                        values = _(values).rest(pipe['$skip']);
                        break;
                    case '$limit':
                        values = _(values).first( pipe['$limit']);
                        break;
                    case '$objectify':
                        values = $objectify(values, pipe[key]);
                        return;
                    default:
                        throw Error(key + ' pipes are not supported (yet?)');
                }
            });
            return values;
        }
    });

    var computeExpression = function(expr, obj){

        if (_.isString(expr) &&
            expr.charAt(0) === '$'){
            // value in a literal expression
            var objKey = expr.substring(1);
            if (objKey === ''){
                return obj;
            }
            return _(objKey.split('.')).reduce(function (memo, key) {
                return memo[key];
            }, obj);
        }

        else if (_.isObject(expr)){
            // handle expressions
            if (_.has(expr,'$fn')){
                // function
                return expr['$fn'](obj);
            }
            else if (_.has(expr, '$literal')){
                return expr['$literal'];
            }
            // Arithmetic Expressions
            else if (_.has(expr, '$add')){
                return _(expr['$add']).reduce(function(sum, e){
                    return sum + computeExpression(e, obj);
                }, 0);
            }
            else if (_.has(expr, '$divide')){
                return computeExpression(expr['$divide'][0], obj) / computeExpression(expr['$divide'][1], obj) ;
            }
            else if (_.has(expr, '$mod')){
                return computeExpression(expr['$mod'][0], obj) % computeExpression(expr['$mod'][1], obj) ;
            }
            else if (_.has(expr, '$multiply')){
                return _(expr['$multiply']).reduce(function(mult, e){
                    return mult * computeExpression(e, obj);
                }, 1);
            }
            else if (_.has(expr, '$subtract')){
                return computeExpression(expr['$subtract'][0], obj) - computeExpression(expr['$subtract'][1], obj) ;
            }
            // Comparison Expressions
            else if (_.has(expr, '$eq')){
                return computeExpression(expr['$eq'][0], obj) === computeExpression(expr['$eq'][1], obj) ;
            }
            else if (_.has(expr, '$ne')){
                return computeExpression(expr['$ne'][0], obj) !== computeExpression(expr['$ne'][1], obj) ;
            }
            else if (_.has(expr, '$gt')){
                return computeExpression(expr['$gt'][0], obj) > computeExpression(expr['$gt'][1], obj) ;
            }
            else if (_.has(expr, '$gte')){
                return computeExpression(expr['$gte'][0], obj) >= computeExpression(expr['$gte'][1], obj) ;
            }
            else if (_.has(expr, '$lt')){
                return computeExpression(expr['$lt'][0], obj) < computeExpression(expr['$lt'][1], obj) ;
            }
            else if (_.has(expr, '$lte')){
                return computeExpression(expr['$lte'][0], obj) <= computeExpression(expr['$lte'][1], obj) ;
            }

            // Boolean expressions
            else if (_.has(expr, '$and')){
                return _(expr['$and']).every(function(e){ return computeExpression(e, obj); });
            }
            else if (_.has(expr, '$or')){
                return _(expr['$or']).some(function(e){ return computeExpression(e, obj); });
            }
            else if (_.has(expr, '$not')){
                return !computeExpression(expr['$not'], obj);
            }

            // String expressions
            else if (_.has(expr, '$substr')){
                var str = computeExpression(expr['$substr'][0], obj),
                    start = computeExpression(expr['$substr'][1], obj),
                    nb = computeExpression(expr['$substr'][2], obj);
                return str.substr(start, nb);
            }
            else if (_.has(expr, '$toLower')){
                return computeExpression(expr['$toLower'], obj).toLowerCase();
            }
            else if (_.has(expr, '$toUpper')){
                return computeExpression(expr['$toUpper'], obj).toUpperCase();
            }

            // Array expressions
            else if (_.has(expr, '$size')){
                return computeExpression(expr['$size'], obj).length;
            }

            // Date expressions (assume date is a momentjs object)
            else if (_.has(expr, '$dayOfMonth')){
                return computeExpression(expr['$dayOfMonth'], obj).date();
            }
            else if (_.has(expr, '$dayOfWeek')){
                // warning : depends on user's locale.
                // See momentjs' documentation for more infos
                return computeExpression(expr['$dayOfWeek'], obj).weekday();
            }
            else if (_.has(expr, '$dayOfYear')){
                return computeExpression(expr['$dayOfYear'], obj).dayOfYear();
            }
            else if (_.has(expr, '$hour')){
                return computeExpression(expr['$hour'], obj).hour();
            }
            else if (_.has(expr, '$millisecond')){
                return computeExpression(expr['$millisecond'], obj).millisecond();
            }
            else if (_.has(expr, '$minute')){
                return computeExpression(expr['$minute'], obj).minute();
            }
            else if (_.has(expr, '$month')){
                return computeExpression(expr['$month'], obj).month();
            }
            else if (_.has(expr, '$second')){
                return computeExpression(expr['$second'], obj).second();
            }
            else if (_.has(expr, '$week')){
                // warning : depends on user's locale.
                // See momentjs' documentation for more infos
                return computeExpression(expr['$week'], obj).week();
            }
            else if (_.has(expr, '$year')){
                return computeExpression(expr['$year'], obj).year();
            }
            else if (_.has(expr, '$valueOf')){
                return computeExpression(expr['$valueOf'], obj).valueOf();
            }
            else if (_.has(expr, '$diff')){
                var diffArgs = _(expr['$diff']).map(function(arg){
                    return computeExpression(arg, obj);
                });
                return -1 * diffArgs[0].diff.apply(diffArgs[0], _.rest(diffArgs, 1));
            }
            // polymorphic
            else if (_.has(expr, '$format')){

                var args = _.isArray(expr['$format']) ? _(expr['$format']).map(function(arg){
                    return computeExpression(arg, obj);
                }) : computeExpression(expr['$format'], obj);

                if (_.isString(args)){
                    return formatStr.apply(args, [obj]);
                }
                else if (args.length === 1 && _.isString(args[0])){
                    return formatStr.apply(args[0], [obj]);
                }
                else if ( _.isString(args[0])){
                    return formatStr.apply(args[0], _.rest(args, 1));
                }
                else {
                    // assume it is a momentjs date object
                    return args[0].format(args[1]);
                }
            }
            else if (_.has(expr, '$parse')){
                // assume that user expect a momentjs date object
                return moment(computeExpression(expr['$parse'], obj));
            }
            else {
                return expr;
            }
        }
        else {
            return expr;
        }
    };

    var computeAccumulation = function(accumulator, expression, items){
        switch(accumulator){
            case '$sum':
                return _.reduce(items, function(sum, item){
                    var value = computeExpression(expression, item) || 0;
                    if (_.isNumber(value)){
                        sum += value;
                    }
                    return sum ;
                }, 0);
            case '$avg':
                var nbValues = 0;
                return _.reduce(items, function(sum, item){
                    var value = computeExpression(expression, item);
                    if (_.isNumber(value)){
                        sum += value;
                        nbValues++;
                    }
                    return sum ;
                }, 0) / nbValues;
            case '$first':
                return computeExpression(expression, _.first(items));
            case '$last':
                return computeExpression(expression, _.last(items));
            case '$max':
                return computeExpression(expression, _.max(items, function(item){
                    return computeExpression(expression, item) || 0;
                }));
            case '$min':
                return computeExpression(expression, _.min(items, function(item){
                    return computeExpression(expression, item) || 0;
                }));
            case '$any':
                return _.some(items, function(item){
                    return computeExpression(expression, item);
                });
            case '$fn':
                return expression(items);
            case '$addToSet':
                return _.uniq(_.map(items, function(item){
                    return computeExpression(expression, item);
                }));
            default:
                var err = 'Accumulator "' + JSON.stringify(accumulator) + '" not supported';
                throw Error(err);
        }
    };

    var satisfyQuery = function(item, key, conditions){
        var value = _(key.split('.')).reduce(function (memo, objKey) {
            if (_.isObject(item)){
                return memo[objKey];
            }
            return memo;
        }, item);

        if (_.isNumber(conditions) ||
            _.isBoolean(conditions)){

            return value === conditions;
        }
        else if (_.isString(conditions)){
            return value === computeExpression(conditions, item);
        }
        else if (_.isObject(conditions)){
            return _.every(_.pairs(conditions), function(condition){

                switch (condition[0]){
                    case '$eq':
                        return value === computeExpression(condition[1], item);
                    case '$gt':
                        return value > computeExpression(condition[1], item);
                    case '$gte':
                        return value >= computeExpression(condition[1], item);
                    case '$lt':
                        return value < computeExpression(condition[1], item);
                    case '$lte':
                        return value <= computeExpression(condition[1], item);
                    case '$in':
                        return _.contains(computeExpression(condition[1], item), value);
                    case '$nin':
                        return !_.contains(computeExpression(condition[1], item), value);
                    case '$ne':
                        return value !== computeExpression(condition[1], item);
                    case '$regex':
                        if (!_.isString(value)){
                            return false;
                        }
                        return !!condition[1].test(value);
                    default :
                        console.info('obj: ', item);
                        console.info('value: ', value);
                        console.info('key: ', key);
                        console.info('conditions: ', conditions);
                        var err = 'not supported condition ' + condition[0];
                        throw Error(err);

                }
            });

        }
        else{
            throw Error('not implemented');
        }
    };

    var $group = function(values, pipeOptions){
        var groupingKey = pipeOptions._id;
        var groups = _.groupBy(values, function(item){
            return computeExpression(groupingKey, item);
        });
        return _.map(_.pairs(groups), function(pair){
            var _id = pair[0], groupItems = pair[1];

            return _.reduce(_.pairs(pipeOptions), function(result, opt){
                var key = opt[0], expr = opt[1];
                if (key === '_id'){
                    // do nothing
                }
                else if (_.isObject(expr)){
                    var acc = _.keys(expr)[0];
                    result[key] = computeAccumulation(acc, expr[acc], groupItems);
                }
                else {
                    var err = '' +
                        'Expression "' + JSON.stringify(expr) + '" not ' +
                        'supported for $group operation';
                    throw Error(err);
                }
                return result;
            } , { _id: _id});
        });
    };

    var $project = function(values, pipeOptions){
        if (_.isString(pipeOptions)){
            return _(values).map(function(item){ return computeExpression(pipeOptions, item); });
        }
        var pairs = _.pairs(pipeOptions);

        return _(values).map(function(item){
            return _.reduce(pairs, function(memo, pair){
                var expr = pair[1], key=pair[0],
                    keyPath = key.split('.'),
                    lastPath = _.last(keyPath),
                    value;
                if (expr === 1 || expr === true){
                    value = computeExpression('$'+key , item);
                }
                else {
                    value = computeExpression(expr , item);
                }
                _(keyPath).reduce(function (obj, path) {
                    obj[path] = path === lastPath ? value : obj[path] || {};
                    return obj[path];
                }, memo);

                return memo;
            }, {});
        });
    };

    var $match = function(values, pipeOptions){
        if (_.isNumber(pipeOptions)){
            // shortcut for number equality match
            return _(values).filter(function(item){
                return satisfyQuery(item, '$', pipeOptions);
            });
        }

        return _(_.pairs(pipeOptions)).reduce(function(memo, pair){
            var key = pair[0], conditions = pair[1];

            if (key === '$and'){
                return _(conditions).reduce(function(remaining, condition){
                    return _.intersection(remaining, $match(remaining, condition));
                }, memo);
            }
            else if (key === '$or'){
                return _(conditions).reduce(function(found, condition){
                    return _.union(found, $match(memo, condition));
                }, []);
            }
            else if (key === '$nor'){
                return _(conditions).reduce(function(remaining, condition){
                    return _.difference(remaining, $match(remaining, condition));
                }, memo);
            }
            return _(memo).filter(function(item){
                return satisfyQuery(item, key, conditions);
            });
        }, values);
    };

    var $objectify = function(values, pipeOptions){
        var options = _.extend({
            _key: '$_id',
            _value: '$'
        }, pipeOptions || {});

        return _(values).reduce(function(memo, item){
            var key = computeExpression(options._key, item),
                value = computeExpression(options._value, item);
            memo[key] = value;
            return memo;
        }, {});

    };

    // string formating utility
    // adapted from string-format#0.2.1
    // see https://github.com/davidchambers/string-format
    var formatStr;
    (function() {
        var lookup, resolve,
            __slice = [].slice;

        formatStr  = function() {
            var args, explicit, idx, implicit, message,
                _this = this;
            args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
            if (args.length === 0) {
                return function() {
                    var args;
                    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
                    return formatStr.apply(_this, args);
                };
            }
            idx = 0;
            explicit = implicit = false;
            return this.replace(/([{}])\1|[{](.*?)(?:!(.+?))?[}]/g, function(match, literal, key, transformer) {
                var fn, value, _ref, _ref1, _ref2;
                if (literal) {
                    return literal;
                }
                if (key.length) {
                    explicit = true;
                    if (implicit) {
                        throw new Error('cannot switch from {implicit} to {explicit} numbering');
                    }
                    value = (_ref = lookup(args, key)) != null ? _ref : '';
                } else {
                    implicit = true;
                    if (explicit) {
                        throw new Error(message('explicit', 'implicit'));
                    }
                    value = (_ref1 = args[idx++]) != null ? _ref1 : '';
                }
                value = value.toString();
                if (fn = formatStr.transformers[transformer]) {
                    return (_ref2 = fn.call(value)) != null ? _ref2 : '';
                } else {
                    return value;
                }
            });
        };

        lookup = function(object, key) {
            var match;
            if (!/^(\d+)([.]|$)/.test(key)) {
                key = '0.' + key;
            }
            while (match = /(.+?)[.](.+)/.exec(key)) {
                object = resolve(object, match[1]);
                key = match[2];
            }
            return resolve(object, key);
        };

        resolve = function(object, key) {
            var value;
            value = object[key];
            if (typeof value === 'function') {
                return value.call(object);
            } else {
                return value;
            }
        };

        formatStr.transformers = {};

        formatStr.version = '0.2.1';

    }).call(this);

}).call(this);