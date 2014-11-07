'use strict';

(function() {

    describe('readme main examples', function(){

        var logs;
        beforeEach(function(){
            logs = [
                { level: 'warn',  date: '1999-12-31 23:59' },
                { level: 'debug', date: '2000-01-01 00:00' },
                { level: 'info',  date: '2000-01-01 01:00' },
                { level: 'warn',  date: '2000-01-01 02:00' },
                { level: 'error', date: '2000-01-01 03:00' },
                { level: 'error', date: '2000-01-01 03:30' },
                { level: 'info',  date: '2000-01-01 04:00' }
            ];
        });

        it('should work', function(){
            var aggregation = _(logs).aggregate([
                {
                    $project: {
                        level: 1, // <=> level : '$level'
                        date: { $parse: '$date' }
                    }
                },
                {
                    $match: {
                        level: { $in: ['warn', 'error'] },
                        date: {
                            $gte: moment('2000-01-01 00:00'),
                            $lt: moment('2000-01-02 00:00')
                        }
                    }
                },
                {
                    $group: {
                        _id: '$level',
                        count: { $sum: 1 },
                        start: { $min: '$date' }
                    }
                },
                {
                    $project: {
                        level: '$_id',
                        count: 1,
                        startedAt: { $format: ['$start', 'LT']}
                    }
                }
            ]);
            expect(aggregation.length).toBe(2);
        });

        it('should support chaining', function(){
            var aggregation = _(logs).$project({
                level: 1, // <=> level : '$level'
                date: { $parse: '$date' }
            }).$match({
                level: { $in: ['warn', 'error'] },
                date: {
                    $gte: moment('2000-01-01 00:00'),
                    $lt: moment('2000-01-02 00:00')
                }
            }).$group({
                _id: '$level',
                count: { $sum: 1 },
                start: { $min: '$date' }
            }).$project({
                level: '$_id',
                count: 1,
                startedAt: { $format: ['$start', 'LT']}
            }).value();

            expect(aggregation.length).toBe(2);
            console.info(JSON.stringify(aggregation, null, 4));
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
//                console.info(mess);
            });
        });
    });

    describe('expressions', function(){
        it('should display field paths', function () {

            var result = _([{
                name: 'Homer Simpson',
                gender: 'male' ,
                address : { n: 742, road: 'Evergreen Terrace', city: 'Springfield' },
                birthday: moment('1955-05-12')
            }]).aggregate([{
                $project :  {
                    name : 1,
                    address: { $format: '{address.n} {address.road}, {address.city}' },
                    age : { $subtract: [moment().year(), { $year: '$birthday' } ] }
                }
            }]);

//            console.info(JSON.stringify(result, null, 4));

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

//            console.info(JSON.stringify(out, null, 4));
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

//            console.info(JSON.stringify(out, null, 4));
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

//            console.info(JSON.stringify(out, null, 4));
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

//            console.info(JSON.stringify(out, null, 4));
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
            //console.info(JSON.stringify(out, null, 4));
        });

        describe('stackoverflow answers', function () {
            it('should solve http://stackoverflow.com/questions/26128647/lodash-how-to-convert-a-nested-object-into-a-unique-array', function () {
                expect(_([
                    {
                        id: 123123,
                        name: 'Some Product',
                        atts: {
                            lowfreqrange: 100,
                            package: 'connector',
                            amplifier: 'narrowband'
                        }
                    },
                    {
                        id: 5556652,
                        name: 'Some Second Product',
                        atts: {
                            lowfreqrange: 50,
                            package: 'drop-in',
                            amplifier: 'LNA'
                        }
                    },
                    {
                        id: 5465456,
                        name: 'Some 2 Product',
                        atts:{
                            lowfreqrange: 100,
                            package: 'connector',
                            amplifier: 'narrowband'
                        }
                    }
                ]).aggregate([
                    {
                        $group: {
                            _id: 1, // single group expected
                            lowfreqrange: { $addToSet: '$atts.lowfreqrange' },
                            amplifier: { $addToSet: '$atts.amplifier' },
                            package: { $addToSet: '$atts.package' }
                        }
                    }
                ])).toEqual([{
                    _id: '1', // single group expected
                    lowfreqrange: [100, 50],
                    amplifier: ['narrowband', 'LNA'],
                    package: ['connector', 'drop-in']
                }]);
            });

            it('should solve http://stackoverflow.com/questions/17834453/filtering-an-object-array-with-duplicate-titles-and-unique-description', function () {
                expect(_([
                    {
                        'Title': 'New York',
                        'Description': 'A healthy and modernized transit system'
                    },
                    {
                        'Title': 'New York',
                        'Description': 'changed transit system'
                    },
                    {
                        'Title': 'New York',
                        'Description': 'xyz'
                    },
                    {
                        'Title': 'New York',
                        'Description': 'abc'
                    },
                    {
                        'Title': 'chicago',
                        'Description': 'jdfjjfj'
                    },
                    {
                        'Title': 'chicago',
                        'Description': 'abcdfdjf'
                    }
                ]).aggregate([
                    {
                        $group: { _id: '$Title', Descriptions: { $addToSet: '$Description' } }
                    },
                    {
                        $project: { Title: '$_id', Descriptions: '$Descriptions' }
                    }
                ])).toEqual([
                    {
                        Title: 'New York',
                        Descriptions: [
                            'A healthy and modernized transit system',
                            'changed transit system',
                            'xyz',
                            'abc'
                        ]
                    },
                    {
                        Title: 'chicago',
                        Descriptions: [
                            'jdfjjfj',
                            'abcdfdjf'
                        ]
                    }
                ]);
            });

            it('should solve http://stackoverflow.com/questions/21330689/underscore-how-to-filter-the-object-using-multiple-values', function () {
                expect(_([
                    {'name':'one', 'age':'3'},
                    {'name':'two', 'age':'1'},
                    {'name':'three', 'age':'3'},
                    {'name':'four', 'age':'1'},
                    {'name':'one', 'age':'7'},
                    {'name':'one', 'age':'5'},
                    {'name':'one', 'age':'7'},
                    {'name':'one', 'age':'8'},
                    {'name':'one', 'age':'7'},
                    {'name':'one', 'age':'11'},
                    {'name':'one', 'age':'7'}
                ]).aggregate([
                    {
                        $match: { age: { $nin : ['7', '8', '5', '11']} }
                    }
                ])).toEqual([
                    {'name':'one', 'age':'3'},
                    {'name':'two', 'age':'1'},
                    {'name':'three', 'age':'3'},
                    {'name':'four', 'age':'1'}
                ]);
            });

            it('should solve http://stackoverflow.com/questions/12787514/reduce-javascript-array-with-underscore-js-or-with-pure-javascript', function(){
                var currentDate = moment('2000-11-05T22:15:30Z'),
                    items = [
                    {'id':'338b79f07dfe8b3877b3aa41a5bb8a58','date':'2000-10-05T13:21:30Z','value': {'country':'United States'}},
                    {'id':'338b79f07dfe8b3877b3aa41a5bb983e','date':'2000-02-05T13:21:30Z','value': {'country':'Norway'}},
                    {'id':'338b79f07dfe8b3877b3aa41a5ddfefe','date':'2000-12-05T13:21:30Z','value': {'country':'Hungary'}},
                    {'id':'338b79f07dfe8b3877b3aa41a5fe29d7','date':'2000-05-05T13:21:30Z','value': {'country':'United States'}},
                    {'id':'b6ed02fb38d6506d7371c419751e8a14','date':'2000-05-05T18:15:30Z','value': {'country':'Germany'}},
                    {'id':'b6ed02fb38d6506d7371c419753e20b6','date':'2000-12-05T18:15:30Z','value': {'country':'Hungary'}},
                    {'id':'b6ed02fb38d6506d7371c419755f34ad','date':'2000-06-05T18:15:30Z','value': {'country':'United States'}},
                    {'id':'b6ed02fb38d6506d7371c419755f3e17','date':'2000-04-05T22:15:30Z','value': {'country':'Germany'}},
                    {'id':'338b79f07dfe8b3877b3aa41a506082f','date':'2000-07-05T22:15:30Z','value': {'country':'United Kingdom'}},
                    {'id':'9366afb036bf8b63c9f45379bbe29509','date':'2000-11-05T22:15:30Z','value': {'country':'United Kingdom'}}
                ];
                expect(_(items).aggregate([
                    {
                        $project: {
                            date: { $parse: '$date'}, // convert string to date
                            ref: '$' // keep ref to the obj
                        }
                    },
                    {
                        $group: {
                            _id: {$fn: function(item){ return item.date < currentDate ? 'lt' : 'gte'; }},
                            set: { $addToSet : '$ref' }
                        }
                    },
                    {
                        $objectify: { _key: '$_id', _value: '$set' } // convert [{ _id: 'lt', set: [...] }, { _id: 'gte', set: [...] }] to { lt: [...], gte: [...] }
                    }
                ])).toEqual({
                    lt: [
                        {'id':'338b79f07dfe8b3877b3aa41a5bb8a58','date':'2000-10-05T13:21:30Z','value': {'country':'United States'}},
                        {'id':'338b79f07dfe8b3877b3aa41a5bb983e','date':'2000-02-05T13:21:30Z','value': {'country':'Norway'}},
                        {'id':'338b79f07dfe8b3877b3aa41a5fe29d7','date':'2000-05-05T13:21:30Z','value': {'country':'United States'}},
                        {'id':'b6ed02fb38d6506d7371c419751e8a14','date':'2000-05-05T18:15:30Z','value': {'country':'Germany'}},
                        {'id':'b6ed02fb38d6506d7371c419755f34ad','date':'2000-06-05T18:15:30Z','value': {'country':'United States'}},
                        {'id':'b6ed02fb38d6506d7371c419755f3e17','date':'2000-04-05T22:15:30Z','value': {'country':'Germany'}},
                        {'id':'338b79f07dfe8b3877b3aa41a506082f','date':'2000-07-05T22:15:30Z','value': {'country':'United Kingdom'}},
                    ],
                    gte: [
                        {'id':'338b79f07dfe8b3877b3aa41a5ddfefe','date':'2000-12-05T13:21:30Z','value': {'country':'Hungary'}},
                        {'id':'b6ed02fb38d6506d7371c419753e20b6','date':'2000-12-05T18:15:30Z','value': {'country':'Hungary'}},
                        {'id':'9366afb036bf8b63c9f45379bbe29509','date':'2000-11-05T22:15:30Z','value': {'country':'United Kingdom'}}
                    ]
                });
            });

            it('should solve http://stackoverflow.com/questions/19349881/at-underscore-js-can-i-get-multiple-columns-with-pluck-method-after-input-where', function () {
                var people = [
                    {firstName : 'Thein', city : 'ny', qty : 5},
                    {firstName : 'Michael', city : 'ny', qty : 3},
                    {firstName : 'Bloom', city : 'nj', qty : 10}
                ];

                expect(_(people).aggregate([
                    { $where:  { city : 'ny' }},
                    { $project: { firstName: 1, qty: 1 }
                }])).toEqual([ { firstName : 'Thein', qty : 5}, { firstName : 'Michael', qty : 3} ]);
            });
        });
    });
}());