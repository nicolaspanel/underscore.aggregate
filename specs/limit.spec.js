'use strict';

(function() {

    describe('$limit', function () {
        it('should limit over the specified number of items', function () {
            expect(_(_.range(10)).aggregate([{ $limit : 5}])).toEqual([0, 1, 2, 3, 4]);
        });
    });
})();