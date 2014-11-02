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
}());