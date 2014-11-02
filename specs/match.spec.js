'use strict';

(function() {

    describe('$match', function(){
        describe('with fibonacci numbers', function () {
            var values;
            beforeEach(function () {
                values = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34];
            });

            it('should support equality match', function () {
                expect(_(values).aggregate([ { $match : { $ : 1 } } ])).toEqual([1, 1]);
            });

            it('should support $gt operator', function () {
                expect(_(values).aggregate([ { $match : { $ : { $gt: 13 } } } ])).toEqual([21, 34]);
            });
            it('should support $gte operator', function () {
                expect(_(values).aggregate([ { $match : { $ : { $gte: 13 } } } ])).toEqual([13, 21, 34]);
            });
            it('should support $lt operator', function () {
                expect(_(values).aggregate([ { $match : { $ : { $lt: 1 } } } ])).toEqual([0]);
            });
            it('should support $lte operator', function () {
                expect(_(values).aggregate([ { $match : { $ : { $lte: 1 } } } ])).toEqual([0, 1, 1]);
            });
            it('should support $in operator', function () {
                expect(_(values).aggregate([ { $match : { $ : { $in: [1, 8] } } } ])).toEqual([1, 1, 8]);
            });
            it('should support $nin operator', function () {
                expect(_(values).aggregate([ { $match : { $ : { $nin: [1, 8] } } } ])).toEqual([0, 2, 3, 5, 13, 21, 34]);
            });
            it('should support $ne operator', function () {
                expect(_(values).aggregate([ { $match : { $ : { $ne: 1 } } } ])).toEqual([0, 2, 3, 5, 8, 13, 21, 34]);
            });
        });

        describe('with simpson objects', function () {
            var simpsons;
            beforeEach(function () {
                simpsons = [
                    { name: 'Maggie Simpson',  gender: 'female', age: 2,  baby: true , address : { n: 742, road: 'Evergreen Terrace', city: 'Springfield' }},
                    { name: 'Lisa Simpson',    gender: 'female', age: 8,  baby: false, address : { n: 742, road: 'Evergreen Terrace', city: 'Springfield' }},
                    { name: 'Bart Simpson',    gender: 'male' ,  age: 10, baby: false, address : { n: 742, road: 'Evergreen Terrace', city: 'Springfield' }},
                    { name: 'Homer Simpson',   gender: 'male' ,  age: 38, baby: false, address : { n: 742, road: 'Evergreen Terrace', city: 'Springfield' }},
                    { name: 'Marge Simpson',   gender: 'female', age: 40, baby: false, address : { n: 742, road: 'Evergreen Terrace', city: 'Springfield' }},
                    { name: 'Ned Flanders',    gender: 'male',   age: 35, baby: false, address : { n: 740, road: 'Evergreen Terrace', city: 'Springfield' }},
                    { name: 'Moe Szyslak',     gender: 'male',   age: 40, baby: false, address : { n: 57,  road: 'Walmut Street',     city: 'Springfield' }},
                    { name: 'Abraham Simpson', gender: 'male',   age: 83, baby: false, address : { city: 'Springfield' }}
                ];
            });

            it('should support equality match with strings', function () {
                var result = _(simpsons).aggregate([ { $match : { gender : 'female' } } ]);
                expect(result.length).toBe(3);
                expect(result[0]).toBe(simpsons[0]);
                expect(result[1]).toBe(simpsons[1]);
                expect(result[2]).toBe(simpsons[4]);
            });

            it('should support equality match with integer', function () {
                var result = _(simpsons).aggregate([ { $match : { 'address.road' : 'Walmut Street' } } ]);
                expect(result).toEqual([simpsons[6]]);
            });

            it('should support equality match on nested attributes', function () {
                var result = _(simpsons).aggregate([ { $match : { age : 2 } } ]);
                expect(result.length).toBe(1);
            });

            it('should support equality match with boolean', function () {
                var result = _(simpsons).aggregate([ { $match : { baby : true } } ]);
                expect(result.length).toBe(1);
            });

            it('should support $in operator', function () {
                var result = _(simpsons).aggregate([ { $match : {
                    name: { $in: ['Maggie Simpson', 'Lisa Simpson'] }
                } } ]);
                expect(result.length).toBe(2);
            });

            it('should support $gt operator', function () {
                expect(_(simpsons).aggregate([ {
                    $match : { age: { $gt: 80 }}
                }])).toEqual([simpsons[7]]);
            });

            it('should support $gte operator', function () {
                expect(_(simpsons).aggregate([ {
                    $match : { age: { $gte: 83 }}
                }])).toEqual([simpsons[7]]);
            });

            it('should support $lt operator', function () {
                var result = _(simpsons).aggregate([ { $match : { age: { $lt: 10 }} }]);
                expect(result.length).toBe(2);
            });

            it('should support $lte operator', function () {
                var result = _(simpsons).aggregate([ { $match : { age: { $lte: 10 }} }]);
                expect(result.length).toBe(3);
            });

            it('should support $regex operator', function () {
                var result = _(simpsons).aggregate([ {
                    $match : { name: { $regex: /.* Simpson$/ }}
                }]);
                expect(result.length).toBe(6);
            });

            it('should support multiple operators', function () {
                expect(_(simpsons).aggregate([{
                    $match: {
                        age: { $gte: 21, $lte: 80 },
                        'address.city' : 'Springfield',
                        gender: 'male',
                        name: { $regex: /.* Simpson$/ }
                    }
                }])).toEqual([simpsons[3]]);
            });
        });

        describe('with logs', function () {
            var logs;
            beforeEach(function () {
                logs = [
                    { level: 'warn',  date: moment('1999-12-31 23:59'), content: 'dates may be a problem ...' },
                    { level: 'debug', date: moment('2000-01-01 00:00'), content: 'everything seems to be fine ...' },
                    { level: 'info',  date: moment('2000-01-01 01:00'), content: 'current date is ...' },
                    { level: 'warn',  date: moment('2000-01-01 02:00'), content: 'possible memory leak ...' },
                    { level: 'error', date: moment('2000-01-01 03:00'), content: 'throw an error during date conversion...' },
                    { level: 'info',  date: moment('2000-01-01 04:00'), content: 'everything seems ok' }
                ];

            });


            it('should support $gt operator with dates', function(){
                var result = _(logs).aggregate([{
                    $match: { date: { $gt: moment('2000-01-01 02:00') } }
                }]);
                expect(result.length).toBe(2);
            });
            it('should handle $gte operator with dates', function(){
                var result = _(logs).aggregate([{
                    $match: { date: { $gte: moment('2000-01-01 02:00') } }
                }]);
                expect(result.length).toBe(3);
            });
            it('should support $lt operator with dates', function(){
                var result = _(logs).aggregate([{
                    $match: { date: { $lt: moment('2000-01-01 00:00') } }
                }]);
                expect(result.length).toBe(1);
            });
            it('should handle $lte operator with dates', function(){
                var result = _(logs).aggregate([{
                    $match: { date: { $lte: moment('2000-01-01 00:00') } }
                }]);
                expect(result.length).toBe(2);
            });
            it('should handle multiple comparison operators with dates', function(){
                var result = _(logs).aggregate([{
                    $match: {
                        date: {
                            $gt: moment('2000-01-01 00:00'),
                            $lt: moment('2000-01-01 04:00')
                        }
                    }
                }]);
                expect(result.length).toBe(3);
            });
            it('should handle multiple attributes', function(){
                var result = _(logs).aggregate([{
                    $match: {
                        level: { $in: ['warn', 'error'] },
                        date: { $gte: moment('2000-01-01 00:00') },
                        content: { $regex: /.*[dD]ate.*/}
                    }
                }]);
                expect(result).toEqual([logs[4]]);
            });
        });

        describe('with logical table', function () {
            var table;
            beforeEach(function () {
                table = [
                    {a: 0, b: 0, notA: 1 },
                    {a: 0, b: 1, notA: 1 },
                    {a: 1, b: 0, notA: 0 },
                    {a: 1, b: 1, notA: 0 }
                ];
            });
            it('should support equality match with static values', function () {
                expect(_(table).aggregate([{
                    $match : { a : 1 } }
                ])).toEqual([table[2], table[3]]);
            });
            it('should support equality match with expressions values', function () {
                expect(_(table).aggregate([{
                    $match : { a : '$b' } }
                ])).toEqual([table[0], table[3]]);
            });

            it('should support $gt operator', function () {
                expect(_(table).aggregate([
                    {
                        $match:{ a: { $gt: '$b' } }
                    }
                ])).toEqual([table[2]]);
            });
            it('should support $ne operator', function () {
                expect(_(table).aggregate([
                    {
                        $match:{ a: { $ne: '$b' } }
                    }
                ])).toEqual([table[1], table[2]]);
            });
            it('should support $eq operator', function () {
                expect(_(table).aggregate([
                    {
                        $match:{ a: { $eq: '$b' } }
                    }
                ])).toEqual([table[0], table[3]]);
            });
            it('should support $gte operator', function () {
                expect(_(table).aggregate([
                    {
                        $match:{ a: { $gte: '$b' } }
                    }
                ])).toEqual([table[0], table[2], table[3]]);
            });
            it('should support $lt operator', function () {
                expect(_(table).aggregate([
                    {
                        $match:{ a: { $lt: '$b' } }
                    }
                ])).toEqual([table[1]]);
            });
            it('should support $lte operator', function () {
                expect(_(table).aggregate([
                    {
                        $match:{ a: { $lte: '$b' } }
                    }
                ])).toEqual([table[0], table[1], table[3]]);
            });
            it('should support $ne operator', function () {
                expect(_(table).aggregate([
                    {
                        $match:{ a: { $ne: '$notA' } }
                    }
                ])).toEqual(table);

                expect(_(table).aggregate([
                    {
                        $match:{ a: { $ne: '$a' } }
                    }
                ])).toEqual([]);
            });
            it('should support $and operator', function () {
                expect(_(table).aggregate([
                    {
                        $match: { $and: [ { a: { $gt: 0 } } , { b: 1 } ] }
                    }
                ])).toEqual([table[3]]);
            });
            it('should support $or operator', function () {
                expect(_(table).aggregate([
                    {
                        $match: { $or: [ { a: 1 } , { b: 1 } ] }
                    }
                ])).toEqual([table[2], table[3], table[1]]);
            });
            it('should support $nor operator', function () {
                expect(_(table).aggregate([
                    {
                        $match: { $nor: [ { a: 1 } , { b: 1 } ] }
                    }
                ])).toEqual([table[0]]);
            });
        });


    });

}());