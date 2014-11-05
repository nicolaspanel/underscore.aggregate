'use strict';

(function() {

    describe('$sort', function () {

        describe('Numbers', function () {

            it('should handle asc sort', function () {
                var items = _.shuffle([
                    {foo: 0},
                    {foo: 1},
                    {foo: 2}
                ]);
                var result = _(items).aggregate([{ $sort : { foo: 1 }}]);

                expect(result[0]).toEqual({foo: 0});
                expect(result[1]).toEqual({foo: 1});
                expect(result[2]).toEqual({foo: 2});
            });
            it('should handle desc sort', function () {
                var items = _.shuffle([
                    {foo: 0},
                    {foo: 1},
                    {foo: 2}
                ]);
                var result = _(items).aggregate([{ $sort : { foo: -1 }}]);

                expect(result[0]).toEqual({foo: 2});
                expect(result[1]).toEqual({foo: 1});
                expect(result[2]).toEqual({foo: 0});
            });
        });

        describe('String', function () {

            it('should handle asc sort', function () {
                var items = _.shuffle([
                    {foo: 'a'},
                    {foo: 'b'},
                    {foo: 'c'}
                ]);
                var result = _(items).aggregate([{ $sort : { foo: 1 }}]);

                expect(result[0]).toEqual({foo: 'a'});
                expect(result[1]).toEqual({foo: 'b'});
                expect(result[2]).toEqual({foo: 'c'});
            });
            it('should handle desc sort', function () {
                var items = _.shuffle([
                    { foo: 'a' },
                    { foo: 'b' },
                    { foo: 'c' }
                ]);
                var result = _(items).aggregate([{ $sort : { foo: -1 }}]);

                expect(result[0]).toEqual({foo: 'c'});
                expect(result[1]).toEqual({foo: 'b'});
                expect(result[2]).toEqual({foo: 'a'});
            });

        });

        describe('Date', function () {

            it('should handle asc sort', function () {
                var items = _.shuffle([
                    { foo: '2000-01-01T00:00:00'},
                    { foo: '2000-01-01T00:00:01'},
                    { foo: '2000-01-01T00:00:02'}
                ]);
                var result = _(items).aggregate([
                    { $map :  { date: { $parse: '$foo' }, ref: '$' }},
                    { $sort : { date: 1 }},
                    { $map : '$ref' }
                ]);

                expect(result[0]).toEqual({ foo: '2000-01-01T00:00:00'});
                expect(result[1]).toEqual({ foo: '2000-01-01T00:00:01'});
                expect(result[2]).toEqual({ foo: '2000-01-01T00:00:02'});
            });
            it('should handle desc sort', function () {
                var items = _.shuffle([
                    { foo: '2000-01-01T00:00:00'},
                    { foo: '2000-01-01T00:00:01'},
                    { foo: '2000-01-01T00:00:02'}
                ]);
                var result = _(items).aggregate([
                    { $map :  { date: { $parse: '$foo' }, ref: '$' }},
                    { $sort : { date: -1 }},
                    { $map : '$ref' }
                ]);

                expect(result[0]).toEqual({ foo: '2000-01-01T00:00:02'});
                expect(result[1]).toEqual({ foo: '2000-01-01T00:00:01'});
                expect(result[2]).toEqual({ foo: '2000-01-01T00:00:00'});
            });

        });
        describe('Adias', function () {

            it('should handle $sortBy alias', function () {
                var items = _.shuffle([
                    {foo: 0},
                    {foo: 1}
                ]);
                var result = _(items).aggregate([{ $sortBy : { foo: 1 }}]);

                expect(result[0]).toEqual({foo: 0});
            });

            it('should handle $order alias', function () {
                var items = _.shuffle([
                    {foo: 0},
                    {foo: 1}
                ]);
                var result = _(items).aggregate([{ $order : { foo: 1 }}]);

                expect(result[0]).toEqual({foo: 0});
            });

            it('should handle $orderBy alias', function () {
                var items = _.shuffle([
                    {foo: 0},
                    {foo: 1}
                ]);
                var result = _(items).aggregate([{ $orderBy : { foo: 1 }}]);

                expect(result[0]).toEqual({foo: 0});
            });

        });
    });
})();