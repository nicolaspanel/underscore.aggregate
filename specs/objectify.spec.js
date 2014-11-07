'use strict';

(function() {

    describe('$objectify', function(){

        it('should work with default params',  function(){
            expect(_([
                { _id: 'a', _value: 1 },
                { _id: 'b', _value: 2 }
            ]).aggregate([
                { $objectify: {} }
            ])).toEqual({
                a: { _id: 'a', _value: 1 },
                b: { _id: 'b', _value: 2 }
            });
        });

        it('should work with custom keys',  function(){
            expect(_([
                { type: 'a', count : 1 },
                { type: 'b', count: 2 },
                { type: 'c', count: 3 }
            ]).aggregate([
                { $objectify: { _key: '$type', _value: '$count'} }
            ])).toEqual({ a: 1, b: 2, c: 3 });
        });

        it('should support chaining',  function(){
            expect(_([
                { foo: 'a', bar: 1 },
                { foo: 'b', bar: 2 }
            ]).$objectify({ _key: '$foo', _value: '$bar'}).value()).toEqual({ a: 1, b: 2 });
        });
    });

})();