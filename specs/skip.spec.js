'use strict';

(function() {

    describe('$skip', function () {
        it('should skip over the specified number of items', function () {
            expect(_(_.range(10)).aggregate([{ $skip : 5}])).toEqual([5, 6, 7, 8, 9]);
        });
    });
})();