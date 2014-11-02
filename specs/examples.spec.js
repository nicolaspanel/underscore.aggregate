'use strict';

(function() {

    describe('readme main examples', function(){

        var aggregation;
        beforeEach(function(){
            aggregation = _([
                { level: 'debug', handled: true,  date: moment('2000-01-01 00:00') },
                { level: 'info',  handled: false, date: moment('2000-01-01 01:00') },
                { level: 'warn',  handled: false, date: moment('2000-01-01 02:00') },
                { level: 'error', handled: true,  date: moment('2000-01-01 03:00') },
                { level: 'info',  handled: false, date: moment('2000-01-01 04:00') }
            ]).aggregate([
                {
                    $match: {
                        level: { $in: ['warn', 'error'] },
                        date: {
                            $gte: moment('2000-01-01 00:00'),
                            $lt: moment('2000-01-02 00:00')
                        },
                        handled: false
                    }
                },
                {
                    $group: {
                        _id: '$level',
                        count: { $sum: 1 }
                    }
                }
            ]);
        });

        it('should return 1 group with a single warning', function(){
            expect(aggregation.length).toBe(1);
            expect(aggregation[0]._id).toBe('warn');
            expect(aggregation[0].count).toBe(1);
        });

    });

    describe('$group ', function(){
        describe('with fibonacci numbers', function(){
            var aggregation;
            beforeEach(function () {
                aggregation = _([0, 1, 1, 2, 3, 5, 8, 13, 21, 34]).aggregate([
                    {
                        $group: {
                            _id: { $fn: function (value) { return value % 2 ? 'odd' : 'pair'; } },
                            count: { $sum: 1 },
                            sum : { $sum: '$' },
                            avg : { $avg: '$' },
                            first : { $first: '$' },
                            last : { $last: '$' },
                            max : { $max: '$' },
                            min : { $min: '$' },
                            sumSquares: { $fn: function (values) {
                                return _(values).reduce(function (memo, val) {
                                    return memo + Math.pow(val, 2);
                                }, 0);
                            }},
                            values: { $fn: function (values) { return values; }},
                            set : { $addToSet: '$'}
                        }
                    }
                ]);
            });
            it('should return 2 groups ', function(){
                expect(aggregation.length).toBe(2);
                //console.info(JSON.stringify(aggregation));
            });
        });

        describe('with simpsons', function(){
            var aggregation;
            beforeEach(function () {
                aggregation = _([
                    { name: 'Maggie', gender: 'female', age: 2 },
                    { name: 'Lisa', gender: 'female', age: 8 },
                    { name: 'Bart', gender: 'male' , age: 10 },
                    { name: 'Homer', gender: 'male' , age: 38 },
                    { name: 'Marge', gender: 'female' , age: 40 }
                ]).aggregate([
                    {
                        $group: {
                            _id: '$gender',
                            count: { $sum: 1 },
                            avgAge : { $avg: '$age' },
                            maxAge : { $max: '$age' },
                            minAge : { $min: '$age' },
                            names :  { $addToSet: '$name'}
                        }
                    }
                ]);
            });
            it('should return 2 groups ', function(){
                expect(aggregation.length).toBe(2);
//                console.info(JSON.stringify(aggregation, null, 2));
            });
        });


    });

    describe('$match', function(){
        it('should display q results', function(){
            var table = [
                {a: 0, b: 0 },
                {a: 0, b: 1 },
                {a: 1, b: 0 },
                {a: 1, b: 1 }
            ];
            var queries = [
                { a : 1 },
                { a : { $eq : 1 } },
                { a : '$b' },
                { a : { $eq : '$b' } },
                { a : { $gt: 0 }, b : { $lt: 1} },
                { a : { $gt: '$b' }, b : { $gt: '$a'} },
                { $and: [ { a : 1 }, { b : 1 } ]},
                { $nor: [ { a : 1 }, { b : 1 } ]}
            ];
             // => [{a: 1, b: 0 }, {a: 1, b: 1 }]

            _.each(queries, function(q){
                var result = _(table).aggregate([{ $match : q  }]);
                var mess = '' +
                    '_(table).aggregate([{ $match : ' + JSON.stringify(q) + '  }]);' +
                    ' // => ' + JSON.stringify(result);
                console.info(mess);
            });
        });
    });

    describe('expressions', function(){
        it('should display field paths', function () {
            var homer = {
                name: 'Homer Simpson',
                gender: 'male' ,
                address : { n: 742, road: 'Evergreen Terrace', city: 'Springfield' },
                birthday: moment('1955-05-12')
            };
            var paths = [
                { name : 1 },
                { nbKids : { $literal: 3 } }
            ];

            _.each(paths, function(p){
                var result = _([homer]).aggregate([{ $project : p  }]);
                var mess = '' +
                    '_([homer]).aggregate([{ $project : ' + JSON.stringify(p) + '  }]);' +
                    ' // => ' + JSON.stringify(result);
                console.info(mess);
            });
        });
        it('should display dates', function(){
            var out = _([{date: '1987-04-30 12:15:59.123'}]).aggregate([
                {
                    $project : {
                        date: { $parse: '$date' }
                    }
                },
                {
                    $project : {
                        dayOfMonth: { $dayOfMonth: '$date' },
                        dayOfWeek: { $dayOfWeek: '$date' },
                        dayOfYear: { $dayOfYear: '$date' },
                        hour: { $hour: '$date' },
                        millisecond: { $millisecond: '$date' },
                        minute: { $minute: '$date' },
                        month: { $month: '$date' },
                        second: { $second: '$date' },
                        week: { $week: '$date' },
                        year: { $year: '$date' },
                        format: { $format: ['$date', 'LT' ] }
                    }
                }
            ]);

            console.info(JSON.stringify(out, null, 4));
        });
        it('should display string', function(){
            var out = _([{ hello: 'Hello', world: 'World' }]).aggregate([
                {
                    $project : {
                        format1: { $format: ['{hello} {world}!'] },
                        format2: { $format: ['{0} {1}!', '$hello', '$world'] },
                    }
                },
                {
                    $project : {
                        hello: { $substr: [ '$format1', 0, 5 ] } ,
                        world: { $substr: [ '$format2', 6, 5 ] } ,
                        format1: { $toLower: '$format1' },
                        format2: { $toUpper: '$format2' }
                    }
                }
            ]);

            console.info(JSON.stringify(out, null, 4));
        });
        it('should display comparisons', function(){
            var out = _([{ a: 1, b: 2 }]).aggregate([
                {
                    $project : {
                        eq: { $eq: ['$a', '$b'] },
                        ne: { $ne: ['$a', '$b'] },
                        gt: { $gt: ['$a', '$b'] },
                        gte: { $gte: ['$a', '$b'] },
                        lt: { $lt: ['$a', '$b'] },
                        lte: { $lte: ['$a', '$b'] }
                    }
                }
            ]);

            console.info(JSON.stringify(out, null, 4));
        });

        it('should display Arithmetic', function(){
            var out = _([{ a: 1, b: 2 }]).aggregate([
                {
                    $project : {
                        add         : { $add: ['$a', '$b', 2] },
                        divide      : { $divide: ['$a', '$b'] },
                        mod         : { $mod: ['$a', '$b'] },
                        multiply    : { $multiply: [10, '$a', '$b'] },
                        $subtract   : { $subtract: ['$a', '$b'] }
                    }
                }
            ]);

            console.info(JSON.stringify(out, null, 4));
        });
        it('should display booleans', function(){
            var out = _( [{a: true,  b: false }]).aggregate([
                {
                    $project : {
                        a   : 1,
                        b   : 1,
                        and : { $and: ['$a', '$b'] },
                        or  : { $or: ['$a', '$b'] },
                        notA: { $not: '$a' },
                        notB: { $not: '$b' }
                    }
                },
                {
                    $project : {
                        and : { $format: ['{a} and {b} => {and}'] },
                        or  : { $format: ['{a} or {b} => {or}'] },
                        notA: { $format: ['not {a} => {notA}'] },
                        notB: { $format: ['not {b} => {notB}'] }
                    }
                }
            ]);
            console.info(JSON.stringify(out, null, 4));
        });
    });
}());