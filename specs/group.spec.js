'use strict';

(function() {

    describe('$group', function(){
        var getDict = function(groups){
            return _.reduce(groups, function(d, group){
                d[group._id] = group;
                return d;
            }, {});
        };

        describe('with fibonacci numbers grouped by odd', function () {
            var groups, groupsDict;
            beforeEach(function () {
                var fibonacci = _.shuffle([0, 1, 1, 2, 3, 5, 8, 13, 21, 34]);
                groups = _(fibonacci).aggregate([
                    {
                        $group: {
                            _id: { $fn: function (value) { return value % 2 ? 'odd' : 'pair'; } },
                            sum : { $sum: '$' },
                            avg : { $avg: '$' },
                            first: { $first: '$' },
                            last: { $last: '$' },
                            max : { $max: '$' },
                            min : { $min: '$' },
                            set : { $addToSet: '$' }
                        }
                    }
                ]);
                groupsDict = getDict(groups);
            });

            it('should return 2 groups', function () {
                expect(groups.length).toBe(2);
            });

            it('should support compute sum', function(){
                expect(groupsDict.pair.sum).toBe(44);
                expect(groupsDict.odd.sum).toBe(44);
            });

            it('should compute $avg', function(){
                expect(groupsDict.pair.avg).toBe(44 / 4);
                expect(groupsDict.odd.avg).toBe(44 / 6);
            });

            it('should support $first operator', function(){
                expect(groupsDict.pair.first).toBeDefined();
                expect(groupsDict.odd.first).toBeDefined();
            });

            it('should support $last operator', function(){
                expect(groupsDict.pair.last).toBeDefined();
                expect(groupsDict.odd.last).toBeDefined();
            });

            it('should support $max operator', function(){
                expect(groupsDict.odd.max).toBe(21);
                expect(groupsDict.pair.max).toBe(34);
            });
            it('should support $min operator', function(){
                expect(groupsDict.odd.min).toBe(1);
                expect(groupsDict.pair.min).toBe(0);
            });

            it('should support $addToSet operator', function(){
                expect(groupsDict.odd.set.length).toBe(5); // remove duplicate 1
                expect(groupsDict.pair.set.length).toBe(4);
            });
        });

        describe('with simpson grouped by gender', function () {
            var groups, groupsDict;
            beforeEach(function () {
                var simpsons = [
                    { name: 'Maggie', gender: 'female', age: 2,  baby: true },
                    { name: 'Lisa',   gender: 'female', age: 8,  baby: false },
                    { name: 'Bart',   gender: 'male' ,  age: 10, baby: false },
                    { name: 'Homer',  gender: 'male' ,  age: 38, baby: false },
                    { name: 'Marge',  gender: 'female', age: 40, baby: false }
                ];
                groups = _.aggregate(simpsons, [{
                    $group: {
                        _id: '$gender',
                        count: { $sum: 1 },
                        totalAge: { $sum: '$age' },
                        asBaby : { $any: '$baby' },
                        members: { $fn: function(items){ return items; } },
                        first: { $first: '$name' },
                        last: { $last: '$name' },
                        names : { $addToSet: '$name' }
                    }
                }]);
                groupsDict = getDict(groups);
            });
            it('should return 2 groups', function(){
                expect(groups.length).toBe(2);
            });
            it('should support $sum operator with number', function(){
                expect(groupsDict.male.count).toBe(2);
                expect(groupsDict.female.count).toBe(3);
            });

            it('should support $sum operator with expressions', function(){
                expect(groupsDict.male.totalAge).toBe(10 + 38);
                expect(groupsDict.female.totalAge).toBe(2 + 8 + 40);
            });

            it('should support $any operator', function(){
                expect(groupsDict.female.asBaby).toBeTruthy();
                expect(groupsDict.male.asBaby).toBeFalsy();
            });

            it('should support $first operator', function(){
                expect(groupsDict.female.first).toBe('Maggie');
                expect(groupsDict.male.first).toBe('Bart');
            });
            it('should support $last operator', function(){
                expect(groupsDict.female.last).toBe('Marge');
                expect(groupsDict.male.last).toBe('Homer');
            });


            it('should support $fn operator', function(){
                expect(groupsDict.male.members.length).toBe(2);
                expect(groupsDict.female.members.length).toBe(3);
            });

            it('should support $addToSet operator', function(){
                expect(groupsDict.male.names).toEqual(['Bart', 'Homer']);
                expect(groupsDict.female.names).toEqual(['Maggie', 'Lisa', 'Marge']);
            });

        });

    });

}());