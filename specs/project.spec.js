'use strict';

(function() {

    describe('$project', function(){

        it('should keep included fields', function(){
            var projection = _.aggregate([{foo: 'bar', keep: false}], [{
                $project:{
                    foo: 1
                }
            }]);

            expect(projection.length).toBe(1);
            expect(projection[0]).toEqual({
                foo: 'bar'
            });

        });

        it('should handle references', function(){
            var projection = _.aggregate([  {foo: 'bar'} ], [{
                $project:{
                    newField: '$foo'
                }
            }]);

            expect(projection[0]).toEqual({ newField: 'bar'  });

        });

        it('should handle literals', function(){
            var projection = _.aggregate([ { foo: 'bar' } ], [{
                $project:{
                    foo: { $literal: 1 }
                }
            }]);

            expect(projection[0].foo).toEqual('bar');

        });
        it('should handle $add expression with variables', function(){
            var projection = _.aggregate([ { a: 1, b: 2} ], [
                {
                    $project:{
                        c : { $add: ['$a', '$b'] }
                    }
                }
            ]);

            expect(projection[0].c).toBe(3);

        });
        it('should handle $and expression with variables', function(){
            var projection = _.aggregate([ { a: 0, b: 1} ], [
                {
                    $project:{
                        c : { $and: ['$a', '$b'] },
                        d : { $and: ['$b', false] },
                        e : { $and: ['$b', true] }
                    }
                }
            ]);
            expect(projection[0].c).toBe(false);
            expect(projection[0].d).toBe(false);
            expect(projection[0].e).toBe(true);
        });

        it('should handle $add expression with constants', function(){
            var projection = _.aggregate([ { a: 1} ], [
                {
                    $project:{
                        b : { $add: ['$a', 1] }
                    }
                }
            ]);

            expect(projection[0]).toEqual({ b : 2 });

        });
        it('should handle $add expression with date', function(){
            var projection = _.aggregate([ { a: 1000} ], [
                {
                    $project:{
                        date : { $add: [moment('2014-01-01 00:00:00'), '$a'] }
                    }
                }
            ]);

            expect(moment(projection[0].date).valueOf()).toEqual(moment('2014-01-01 00:00:01').valueOf());

        });

        it('should be able to project multiple events', function(){
            var events = [
                    { 'date': '2014-01-01 00:00:00' },
                    { 'date': '2014-01-01 00:00:01' },
                    { 'date': '2014-01-01 00:06:00' }
            ];
            var seqs = _.aggregate(events, [{
                $project: {
                    start: '$date',
                    end  : '$date'
                }
            }]);
            expect(seqs.length).toBe(3);
            _(seqs).each(function(s, i){
                expect(s.start).toEqual(events[i].date);
                expect(s.end).toEqual(events[i].date);
            });
        });

    });



}());