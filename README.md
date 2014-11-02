# Underscore.aggregate

The aggregation pipeline is a framework for data aggregation modeled on the concept of data processing pipelines. 
Objects enter a multi-stage pipeline that transforms them into an aggregated results.

```javascript
_([
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
 
=> [
  { _id: 'warn', count: 1},
  { _id: 'error', count: 1}
]
```

## Installation and usage
1. Choose your preferred method of installation:
 - Through bower: `bower install --save underscore.aggregate`
 - Through npm: `npm install --save underscore.aggregate`
 - Download from Github: [underscore.aggregate.min.js](https://raw.github.com/nicolaspanel/underscore.aggregate/underscore.aggregate.min.js)

2. Include underscore, moment and underscore.aggregate in your application:
```html
<script src="components/moment/moment.js"></script>
<script src="components/underscore/underscore.js"></script>
<script src="components/underscore.aggregate/underscore.aggregate.min.js"></script> 
```

## Quick Reference

### Stages
Pipeline stages appear in an array. Collection items pass through the stages in sequence. 
```javascript
_(collection).aggregate( [ { <stage1> }, { <stage2> }, ... ] );
```

Supported Stages:
- $group
- $match
- $project

#### $group
__Since v0.1.0__

Usage: `{ $group: { _id: <expression>, <field1>: { <accumulator1> : <expression1> }, ... } }`

Supported accumulators :
Name      | Version | Description
--------- | ------- | ------------
$sum      |  0.1.0  | Returns a sum for each group. Ignores non-numeric values.
$avg      |  0.1.0  | Returns an average for each group. Ignores non-numeric values.
$first    |  0.1.0  | Returns a value from the first document for each group..
$max      |  0.1.0  | Returns the highest expression value for each group.
$min      |  0.1.0  | Returns the lowest expression value for each group.
$any      |  0.1.0  | Returns true if any elements of a set evaluate to true; otherwise, returns false.
$addToSet |  0.1.0  | Returns an array of unique expression values for each group. Order of the array elements is undefined.
$fn       |  0.1.0  | Compute custom value based on group items.

Advanced example with numbers: 
```javascript
_([0, 1, 1, 2, 3, 5, 8, 13, 21, 34]).aggregate([
    {
        $group: {
            _id: { $fn: function (value) { return value % 2 ? 'odd' : 'pair'; } },
            count: { $sum: 1 },
            sum : { $sum: '$' },
            sumSquares: { $fn: function (values) {
                return _(values).reduce(function (memo, val) {
                    return memo + Math.pow(val, 2);
                }, 0);
            }},
            avg : { $avg: '$' },
            first : { $first: '$' },
            last : { $last: '$' },
            max : { $max: '$' },
            min : { $min: '$' },
            values: { $fn: function (values) { return values; }},
            set : { $addToSet: '$'}
        }
    }
]);

=>[
    {
        "_id":"pair",
         "count":4, 
         "sum":44, 
         "sumSquares":1224,
         "avg":11, 
         "first":0, 
         "last":34, 
         "max":34, 
         "min":0,
         "values":[0,2,8,34],
         "set":[0,2,8,34]
    },
    {
         "_id":"odd",
         "count":6,
         "sum":44,
         "avg":7.333333333333333, 
         "sumSquares":646,
         "first":1,
         "last":21,
         "max":21,
         "min":1,
         "values":[1,1,3,5,13,21],
         "set":[1,3,5,13,21]
    }
]  
```


Advanced example with objects: 
```javascript
_([
    { name: 'Maggie', gender: 'female', age: 2 },
    { name: 'Lisa',   gender: 'female', age: 8 },
    { name: 'Bart',   gender: 'male' ,  age: 10 },
    { name: 'Homer',  gender: 'male' ,  age: 38 },
    { name: 'Marge',  gender: 'female', age: 40 }
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


=>[ 
    { "_id": "female", "count": 3, "avgAge": 16.67, "maxAge": 40, "minAge": 2 , "names": [ "Maggie", "Lisa", "Marge" ] },
    { "_id": "male",   "count": 2, "avgAge": 24,    "maxAge": 38, "minAge": 10, "names": [ "Bart", "Homer" ] }
]  
```

#### $match
__since v0.1.0__

Filters the items that match the specified condition(s) to the next pipeline stage.

Usage: `{ $match: { <query1>, <query2>, ... } }`

Supported Operators :
Name     | Version | Syntax | Description
-------- | ------- | ------ | ------------
$gt      |  0.1.0  | `{ field: {$gt: <expression> } }` | Matches values that are __greater than__ the value specified in the query. Supports both numbers and dates.
$gte     |  0.1.0  | `{ field: {$gte: <expression> } }` | Matches values that are __greater than or equal to__  the value specified in the query. Supports both numbers and dates.
$lt      |  0.1.0  | `{ field: {$lt: <expression> } }` | Matches values that are __less than__ the value specified in the query. Supports both numbers and dates.
$lte     |  0.1.0  | `{ field: {$lte: <expression> } }` | Matches values that are __less than or equal to__  the value specified in the query. Supports both numbers and dates.
$in      |  0.1.0  | `{ field: { $in: [<expr1>, <expr2>, ... ] } }` | Matches any of the values that __exist__ in the specified array.
$nin     |  0.1.0  | `{ field: { $nin: [<expr1>, <expr2>, ... ] } }` | Matches values that __do not__ exit in the specified array.
$eq      |  0.1.0  | `{ field: {$eq: <expression> } }` | Matches all values that are __equal__ to the specified value.
$ne      |  0.1.0  | `{ field: {$ne: <expression> } }` | Matches all values that are __not equal__ to the specified value.
$and     |  0.1.0  | `{ $and: [ { <query1> }, { <query2> } , ... ] }` | Matches all values that satisfy __all__ given queries.
$or      |  0.1.0  | `{ $or: [ { <query1> }, { <query2> } , ... ] }` | Matches all values that satisfy __any__ of the given queries.
$nor     |  0.1.0  | `{ $nor: [ { <query1> }, { <query2> } , ... ] }` | Matches all values that __do not__ satisfy __any__ of the given queries.
$regex   |  0.1.0  | `{ field: {$regex: <RegExp> } }` | Matches all values that __match__ the given pattern.

Notice: Default operator is `$eq`. Syntax like `{ field: <expression> } }` are evaluated as `{ field: { $eq: <expression> } }`

Advanced examples for logical and comparison query operators:
```javascript
var table = [
    {a: 0, b: 0 },
    {a: 0, b: 1 },
    {a: 1, b: 0 },
    {a: 1, b: 1 }
];
_(table).aggregate([{ $match : { a : 1 } }]);                               // => [{a: 1, b: 0 }, {a: 1, b: 1 }]
_(table).aggregate([{ $match : { a : { $eq : 1 } } }]);                     // => [{a: 1, b: 0 }, {a: 1, b: 1 }]
_(table).aggregate([{ $match : { a : '$b' } }]);                            // => [{a: 0, b: 0 }, {a: 1, b: 1 }]
_(table).aggregate([{ $match : { a : { $eq : '$b' } } }]);                  // => [{a: 0, b: 0 }, {a: 1, b: 1 }]
_(table).aggregate([{ $match : { a : { $gt: 0 }, b : { $lt: 1} } }]);       // => [{a: 1, b: 0 }]
_(table).aggregate([{ $match : { a : { $gt: '$b' }, b : { $xt: '$a'} } }]); // => []
_(table).aggregate([{ $match : { $and: [ { a: 1 }, { b: 1 } ] } }]);        // => [{a: 1, b: 1 }]
_(table).aggregate([{ $match : { $nor: [ { a: 1 }, { b: 1 } ] } }]);        // => [{a: 0, b: 0 }]
```

Advanced example with objects and dates:
```javascript
var logs = [
    { level: 'warn',  date: moment('1999-12-31 23:59'), content: 'dates may be a problem ...' },
    { level: 'debug', date: moment('2000-01-01 00:00'), content: 'everything seems to be fine ...' },
    { level: 'info',  date: moment('2000-01-01 01:00'), content: 'current date is ...' },
    { level: 'warn',  date: moment('2000-01-01 02:00'), content: 'possible memory leak ...' },
    { level: 'error', date: moment('2000-01-01 03:00'), content: 'throw an error during date conversion...' },
    { level: 'info',  date: moment('2000-01-01 04:00'), content: 'everything seems ok' }
];

_(logs).aggregate([{
    $match: {
        level: { $in: ['warn', 'error'] },
        date: { $gte: moment('2000-01-01 00:00') },
        content: { $regex: /.*[dD]ate.*/}
    }
}]);  // => [ { level: 'error', date: {...}, content: 'throw an error during date conversion...' }]
```



## Credits
Largely inspired by the great work of [mongodb](http://www.mongodb.org/)'s community.

## License
Released under the terms of MIT License:

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.