'use strict';

(function() {

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
            else if (_.has(expr,'$add')){
                // function
                return _(expr['$add']).reduce(function(memo, subExpr){
                    var value = computeExpression(subExpr, obj);
                    if  (_.isNumber(memo) && _.isNumber(value)){
                        // assume it is a date
                        return memo + value;
                    }else if  (_.isObject(memo) && _.isNumber(value)){
                        // assume it is a date
                        return memo.add(value, 'ms');
                    }else if  (_.isObject(value) && _.isNumber(memo)){
                        // assume value it is a date
                        return value.add(memo, 'ms');
                    }
                    return memo;
                }, 0);
            }
            else {
                return expr;
            }
        }
        else {
            return expr;
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
        var groups = _.groupBy(values, function(val){
            return computeExpression(groupingKey, val);
        });
        return _.map(_.pairs(groups), function(pair){
            var _id = pair[0], groupItems = pair[1];

            return _.reduce(_.pairs(pipeOptions), function(result, opt){
                var key = opt[0], expr = opt[1];
                if (key === '_id'){
                    // do nothing
                }
                else if (_.isObject(expr) && _.has(expr, '$sum')) {
                    result[key] = _.reduce(groupItems, function(sum, item){
                        var value = computeExpression(expr['$sum'], item) || 0;
                        if (_.isNumber(value)){
                            sum += value;
                        }
                        return sum ;
                    }, 0);
                }
                else if (_.isObject(expr) && _.has(expr, '$avg')) {
                    var nbValues = 0;
                    result[key] = _.reduce(groupItems, function(sum, item){
                        var value = computeExpression(expr['$avg'], item);
                        if (_.isNumber(value)){
                            sum += value;
                            nbValues++;
                        }
                        return sum ;
                    }, 0) / nbValues;
                }
                else if (_.isObject(expr) && _.has(expr, '$first')) {
                    result[key] = computeExpression(expr['$first'], _.first(groupItems));
                }
                else if (_.isObject(expr) && _.has(expr, '$last')) {
                    result[key] = computeExpression(expr['$last'], _.last(groupItems));
                }
                else if (_.isObject(expr) && _.has(expr, '$max')) {
                    var maxObj = _.max(groupItems, function(item){
                        return computeExpression(expr['$max'], item) || 0;
                    });
                    result[key] = computeExpression(expr['$max'], maxObj);
                }
                else if (_.isObject(expr) && _.has(expr, '$min')) {
                    var minObj = _.min(groupItems, function(item){
                        return computeExpression(expr['$min'], item) || 0;
                    });
                    result[key] = computeExpression(expr['$min'], minObj);
                }
                else if (_.isObject(expr) && _.has(expr, '$any')) {
                    result[key] = _.some(groupItems, function(item){
                        return computeExpression(expr['$any'], item);
                    });
                }
                else if (_.isObject(expr) && _.has(expr, '$fn')) {
                    result[key] = expr['$fn'](groupItems);
                }
                else if (_.isObject(expr) && _.has(expr, '$addToSet')) {
                    result[key] = _.uniq(_.map(groupItems, function(item){
                        return computeExpression(expr['$addToSet'], item);
                    }));
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
        var pairs = _.pairs(pipeOptions);

        return _(values).map(function(obj){
            return _.reduce(pairs, function(memo, pair){
                var expr = pair[1], key=pair[0];
                memo[key] = computeExpression(expr, obj, key);
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
                        values = $project(values, pipe[key]);
                        break;
                    case '$group':
                        values = $group(values, pipe[key]);
                        break;
                    case '$match':
                        values = $match(values, pipe[key]);
                        break;
                    default:
                        throw Error(key + ' pipes are not supported (yet?)');
                }
            });
            return values;
        }
    });

}).call(this);