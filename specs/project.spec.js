'use strict';

(function() {

    describe('$project', function(){

        describe('Field path Expressions', function () {
            it('should keep included fields', function(){
                expect(_.aggregate([{foo: 'bar', keep: false}], [{
                    $project:{
                        foo: 1
                    }
                }])).toEqual([{ foo: 'bar' }]);
            });
            it('should keep nested included fields', function(){
                expect(_.aggregate([{foo: { bar: 'hello' , bar2: 'world' }}], [{
                    $project:{
                        'foo.bar': 1,
                        'foo.bar2': 1
                    }
                }])).toEqual([{  foo: { bar: 'hello', bar2: 'world' } }]);
            });

            it('should handle references', function(){
                expect(_.aggregate([  {foo: 'bar'} ], [{
                    $project:{
                        newField: '$foo'
                    }
                }])).toEqual([{ newField: 'bar'  }]);
            });
            it('should handle global reference#1', function(){
                expect(_.aggregate([  {foo: 'bar'} ], [{
                    $project: '$'
                }])).toEqual([ {foo: 'bar'}]);
            });
            it('should handle global reference#1', function(){
                expect(_.aggregate([  {foo: 'bar'} ], [{
                    $project: '$foo'
                }])).toEqual([ 'bar' ]);
            });
        });

        describe('Alias', function(){
            it('should support $map alias', function(){
                expect(_.aggregate([  {foo: 'bar'} ], [{
                    $map: '$foo'
                }])).toEqual([ 'bar' ]);
            });
        });

        describe('Literal expressions', function () {
            it('should handle  literals', function(){
                expect(_.aggregate([ { foo: 'bar' } ], [{
                    $project:{
                        foo: { $literal: 1 }
                    }
                }])).toEqual([{ foo: 1 }]);
            });
            it('should not parse literals', function(){
                expect(_.aggregate([ { foo: 'bar' } ], [{
                    $project:{
                        foo: { $literal: '$foo' }
                    }
                }])).toEqual([{ foo: '$foo' }]);
            });
        });

        describe('Arithmetic Expressions', function () {

            it('should handle $add expression with variables', function(){
                expect(_.aggregate([ { a: 1, b: 2} ], [{
                    $project:{
                        c : { $add: ['$a', '$b', 1] }
                    }
                }])).toEqual([{c: 4}]);
            });

            it('should handle $divide expression with variables', function(){
                expect(_.aggregate([ { a: 1, b: 2} ], [{
                    $project:{
                        c : { $divide: ['$a', '$b'] }
                    }
                }])).toEqual([{c: 0.5}]);
            });
            it('should handle $mod expression with variables', function(){
                expect(_.aggregate([ { a: 1, b: 2} ], [{
                    $project:{
                        c : { $mod: ['$a', '$b'] }
                    }
                }])).toEqual([{c: 1}]);
            });
            it('should handle $multiply expression with variables', function(){
                expect(_.aggregate([ { a: 1, b: 2} ], [{
                    $project:{
                        c : { $multiply: ['$a', '$b', 2] }
                    }
                }])).toEqual([{c: 4}]);
            });

            it('should handle $subtract expression with variables', function(){
                expect(_.aggregate([ { a: 1, b: 2} ], [{
                    $project:{
                        c : { $subtract: ['$a', '$b'] }
                    }
                }])).toEqual([{c: -1}]);
            });

        });

        describe('Boolean expressions', function () {
            it('should handle $and expressions when true', function(){
                expect(_.aggregate([ { a: true, b: true } ], [{
                    $project:{
                        and: { $and: ['$a', '$b'] }
                    }
                }])).toEqual([{ and: true }]);
            });
            it('should handle $and expressions when false', function(){
                expect(_.aggregate([ { a: true, b: false } ], [{
                    $project:{
                        and: { $and: ['$a', '$b'] }
                    }
                }])).toEqual([{ and: false }]);
            });
            it('should handle $or expressions when true', function(){
                expect(_.aggregate([ { a: true, b: false } ], [{
                    $project:{
                        or: { $or: ['$a', '$b'] }
                    }
                }])).toEqual([{ or: true }]);
            });
            it('should handle $or expressions when false', function(){
                expect(_.aggregate([ { a: false, b: false } ], [{
                    $project:{
                        or: { $or: ['$a', '$b'] }
                    }
                }])).toEqual([{ or: false }]);
            });
            it('should handle $not expressions when true', function(){
                expect(_.aggregate([ { a: false } ], [{
                    $project:{
                        not: { $not: '$a' }
                    }
                }])).toEqual([{ not: true }]);
            });
            it('should handle $not expressions when false', function(){
                expect(_.aggregate([ { a: true } ], [{
                    $project:{
                        not: { $not: '$a' }
                    }
                }])).toEqual([{ not: false }]);
            });
        });

        describe('Comparison expressions', function () {
            describe('with numbers', function () {
                it('should handle $eq expressions when true', function(){
                    expect(_.aggregate([ { a: 1.2, b: 1.2 } ], [{
                        $project:{
                            eq: { $eq: ['$a', '$b'] }
                        }
                    }])).toEqual([{ eq: true }]);

                });
                it('should handle $eq expressions when false', function(){
                    expect(_.aggregate([ { a: 1.2, b: -1.2 } ], [{
                        $project:{
                            eq: { $eq: ['$a', '$b'] }
                        }
                    }])).toEqual([{ eq: false }]);
                });

                it('should handle $ne expressions when true', function(){
                    expect(_.aggregate([ { a: 1, b: 2 } ], [{
                        $project:{
                            ne: { $ne: ['$a', '$b'] }
                        }
                    }])).toEqual([{ ne: true }]);

                });
                it('should handle $ne expressions when false', function(){
                    expect(_.aggregate([ { a: 1 } ], [{
                        $project:{
                            ne: { $ne: ['$a', '$a'] }
                        }
                    }])).toEqual([{ ne: false }]);
                });

                it('should handle $gt expressions when true', function(){
                    expect(_.aggregate([ { a: 1, b: 2 } ], [{
                        $project:{
                            gt: { $gt: ['$b', '$a'] }
                        }
                    }])).toEqual([{ gt: true }]);
                });
                it('should handle $gt expressions when false', function(){
                    expect(_.aggregate([ { a: 1, b: 2 } ], [{
                        $project:{
                            gt: { $gt: ['$a', '$b'] }
                        }
                    }])).toEqual([{ gt: false }]);
                    expect(_.aggregate([ { a: 1 } ], [{
                        $project:{
                            gt: { $gt: ['$a', '$a'] }
                        }
                    }])).toEqual([{ gt: false }]);
                });

                it('should handle $gte expressions when true', function(){
                    expect(_.aggregate([ { a: 1, b: 2 } ], [{
                        $project:{
                            gte: { $gte: ['$b', '$a'] }
                        }
                    }])).toEqual([{ gte: true }]);
                    expect(_.aggregate([ { a: 1 } ], [{
                        $project:{
                            gte: { $gte: ['$a', '$a'] }
                        }
                    }])).toEqual([{ gte: true }]);
                });
                it('should handle $gte expressions when false', function(){
                    expect(_.aggregate([ { a: 1, b: 2 } ], [{
                        $project:{
                            gte: { $gte: ['$a', '$b'] }
                        }
                    }])).toEqual([{ gte: false }]);
                });

                it('should handle $lt expressions when true', function(){
                    expect(_.aggregate([ { a: 1, b: 2 } ], [{
                        $project:{
                            lt: { $lt: ['$a', '$b'] }
                        }
                    }])).toEqual([{ lt: true }]);
                });
                it('should handle $lt expressions when false', function(){
                    expect(_.aggregate([ { a: 1, b: 2 } ], [{
                        $project:{
                            lt: { $lt: ['$b', '$a'] }
                        }
                    }])).toEqual([{ lt: false }]);
                    expect(_.aggregate([ { a: 1 } ], [{
                        $project:{
                            lt: { $lt: ['$a', '$a'] }
                        }
                    }])).toEqual([{ lt: false }]);
                });

                it('should handle $lte expressions when true', function(){
                    expect(_.aggregate([ { a: 1, b: 2 } ], [{
                        $project:{
                            lte: { $lte: ['$a', '$b'] }
                        }
                    }])).toEqual([{ lte: true }]);
                    expect(_.aggregate([ { a: 1 } ], [{
                        $project:{
                            lte: { $lte: ['$a', '$a'] }
                        }
                    }])).toEqual([{ lte: true }]);
                });
                it('should handle $lte expressions when false', function(){
                    expect(_.aggregate([ { a: 1, b: 2 } ], [{
                        $project:{
                            lte: { $lte: ['$b', '$a'] }
                        }
                    }])).toEqual([{ lte: false }]);
                });

            });
        });

        describe('Array expressions', function () {
            it('should handle $size expressions with variables', function () {
                expect(_.aggregate([ { array: _.range(10) } ], [{
                    $project:{
                        len: { $size: '$array' }
                    }
                }])).toEqual([{ len: 10 }]);
            });
        });

        describe('String expressions', function () {

            it('should handle $substr expression with 2 arg', function () {
                expect(_([{ fruit: 'bananas' }]).aggregate([{
                    $project: {
                        fruit: { $substr: ['$fruit', 1] }
                    }
                }])).toEqual([{ fruit: 'ananas' }]);
            });

            it('should handle $substr expression with 3 arg', function () {
                expect(_([{ fruit: 'bananas' }]).aggregate([{
                    $project: {
                        fruit: { $substr: ['$fruit', 1, 5] }
                    }
                }])).toEqual([{ fruit: 'anana' }]);
            });
            it('should handle $format expression with no arg', function () {
                expect(_([{ hello: 'Hello', world: 'World' }]).aggregate([{
                    $project: {
                        str: { $format: ['{hello} {world}!'] }
                    }
                }])).toEqual([{ str: 'Hello World!' }]);
            });
            it('should handle $format expression with 1 arg', function () {
                expect(_([{ hello: 'World' }]).aggregate([{
                    $project: {
                        str: { $format: ['Hello {0}!', '$hello'] }
                    }
                }])).toEqual([{ str: 'Hello World!' }]);
            });

            it('should handle $format expression with 2 args', function () {
                expect(_([{ hello: 'Hello', world: 'World' }]).aggregate([{
                    $project: {
                        str: { $format: ['{0} {1}!', '$hello', '$world'] }
                    }
                }])).toEqual([{ str: 'Hello World!' }]);
            });

            it('should handle $toLower expression', function () {
                expect(_([{ str: 'Hello World!' }]).aggregate([{
                    $project: {
                        str: { $toLower: '$str' }
                    }
                }])).toEqual([{ str: 'hello world!' }]);
            });

            it('should handle $toUpper expression', function () {
                expect(_([{ str: 'Hello World!' }]).aggregate([{
                    $project: {
                        str: { $toUpper: '$str' }
                    }
                }])).toEqual([{ str: 'HELLO WORLD!' }]);
            });
        });

        describe('Date expressions', function () {
            it('should handle $dayOfMonth expressions', function () {
                expect(_.aggregate([ { date: moment('1987-04-30 12:15:00') } ], [{
                    $project:{
                        result: { $dayOfMonth: '$date' }
                    }
                }])).toEqual([{ result: 30 }]);
            });
            it('should handle $dayOfWeek expressions', function () {
                expect(_.aggregate([ { date: moment('1987-04-30 12:15:00') } ], [{
                    $project:{
                        result: { $dayOfWeek: '$date' }
                    }
                }])).toEqual([{ result: 4 }]);
            });
            it('should handle $dayOfYear expressions', function () {
                expect(_.aggregate([ { date: moment('1987-04-30 12:15:00') } ], [{
                    $project:{
                        result: { $dayOfYear: '$date' }
                    }
                }])).toEqual([{ result: 120 }]);
            });
            it('should handle $hour expressions', function () {
                expect(_.aggregate([ { date: moment('1987-04-30 12:15:00') } ], [{
                    $project:{
                        result: { $hour: '$date' }
                    }
                }])).toEqual([{ result: 12 }]);
            });
            it('should handle $millisecond expressions', function () {
                expect(_.aggregate([ { date: moment('1987-04-30 12:15:00.666') } ], [{
                    $project:{
                        result: { $millisecond: '$date' }
                    }
                }])).toEqual([{ result: 666 }]);
            });
            it('should handle $minute expressions', function () {
                expect(_.aggregate([ { date: moment('1987-04-30 12:15:00.666') } ], [{
                    $project:{
                        result: { $minute: '$date' }
                    }
                }])).toEqual([{ result: 15 }]);
            });
            it('should handle $month expressions', function () {
                expect(_.aggregate([ { date: moment('1987-04-30 12:15:00.666') } ], [{
                    $project:{
                        result: { $month: '$date' }
                    }
                }])).toEqual([{ result: 3 }]);
            });
            it('should handle $second expressions', function () {
                expect(_.aggregate([ { date: moment('1987-04-30 12:15:14.666') } ], [{
                    $project:{
                        result: { $second: '$date' }
                    }
                }])).toEqual([{ result: 14 }]);
            });
            it('should handle $week expressions', function () {
                expect(_.aggregate([ { date: moment('1987-04-30 12:15:14.666') } ], [{
                    $project:{
                        result: { $week: '$date' }
                    }
                }])).toEqual([{ result: 18 }]);
            });
            it('should handle $year expressions', function () {
                expect(_.aggregate([ { date: moment('1987-04-30 12:15:14.666') } ], [{
                    $project:{
                        result: { $year: '$date' }
                    }
                }])).toEqual([{ result: 1987 }]);
            });
            it('should handle $format expressions', function () {
                expect(_.aggregate([ { date: moment('1987-04-30 12:15:14.666') } ], [{
                    $project:{
                        result: { $format: ['$date', 'YYYY-MM-DD'] }
                    }
                }])).toEqual([{ result: '1987-04-30' }]);
            });
            it('should handle $parse expressions', function () {
                expect(_.aggregate([ { date: '1987-04-30 12:15:14.666' } ], [{
                    $project:{
                        result: { $parse: '$date' }
                    }
                }])).toEqual([{ result : moment('1987-04-30 12:15:14.666')}]);
            });
            it('should handle $valueOf expressions', function () {
                expect(_.aggregate([ { date: moment('1987-04-30 12:15:14.666') } ], [{
                    $project:{
                        result: { $valueOf: '$date' }
                    }
                }])).toEqual([{ result : moment('1987-04-30 12:15:14.666').valueOf()}]);
            });

            it('should handle $diff expressions', function () {
                expect(_([{
                    date1: '1987-04-30 12:15:14.666' ,
                    date2: '2014-04-31 12:15:14.666'
                }]).aggregate([
                    {
                        $project: {
                            date1: { $parse: '$date1' },
                            date2: { $parse: '$date2' }
                        }
                    },
                    {
                        $project:{
                            nbDays: { $diff: ['$date1', '$date2', 'days'] },
                            nbYears: { $diff: ['$date1', '$date2', 'years'] },
                            nbSeconds: { $diff: ['$date1', '$date2', 'seconds']},
                            nbMilliseconds: { $diff: ['$date1', '$date2']}
                        }
                    }
                ])).toEqual([{
                    nbDays : 9863,
                    nbYears : 27,
                    nbSeconds : 852163200,
                    nbMilliseconds: 852163200000
                }]);
            });
        });

    });



}());