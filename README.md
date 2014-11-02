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

#### $project
__since v0.1.0__

Passes the specified fields to the next stage in the pipeline. 
The specified fields can be existing fields from the input object or newly computed fields.

Usage: `{ $project: { <specifications> } }`

Supported syntax for specifications :
Syntax                  | Version | Description
----------------------- | ------- | ------------
`<field>: <1 or true>`  |  0.1.0  | Specify the inclusion of a field.
`<field>: <expression>` |  0.1.0  | Add a new field or reset the value of an existing field.


### Expressions
Expressions can include :
 - field paths
 - literals
 - operators

#### Field paths expressions
Use `$<field>" to specify the field path.

Field pass expressions can be nested. Ex: `$foo.bar`

#### Literal expressions
They can be of any type. However, `underscore.aggregate` parses string literals that start with a dollar sign `$` as a path to a field and numeric/boolean literals in expression objects as projection flags. 
To avoid parsing literals, use the `$literal` expression.

Example : `foo : { $literal : <value> }`

#### Operator expressions
They are similar to functions that take arguments. In general, these expressions take an array of arguments and have the following form: `{ <operator>: [ <argument1>, <argument2> ... ] }`. 
If operator accepts a single argument, you can omit the outer array designating the argument list: `{ <operator>: <argument> }`.

Available operators are listed bellow:
##### Arithmetic

 Name     | Version | Syntax | Description
 -------- | ------- | ------ | ------------
 $add     |  0.1.0  | `<field> : { $add: [ <expr1>, <expr2>, ... ]}` | Adds numbers to return the sum. Accepts any number of argument expressions.
 $divide  |  0.1.0  | `<field> : { $divide: [ <expr1>, <expr2> ]}` | Returns the result of dividing the first number by the second. Accepts two argument expressions.
 $mod     |  0.1.0  | `<field> : { $mod: [ <expr1>, <expr2> ]}` | Returns the remainder of the first number divided by the second. Accepts two argument expressions.
 $multiply|  0.1.0  | `<field> : { $multiply: [ <expr1>, <expr2>, ... ]}` | Multiplies numbers to return the product. Accepts any number of argument expressions.
 $subtract|  0.1.0  | `<field> : { $subtract: [ <expr1>, <expr2> ]}` | Returns the result of subtracting the second value from the first.  Accepts two argument expressions.

Example : 
```javascript
_([{ a: 1, b: 2 }]).aggregate([
    {
        $project : {
            add         : { $add: ['$a', '$b', 2] },
            divide      : { $divide: ['$a', '$b'] },
            mod         : { $mod: ['$a', '$b'] },
            multiply    : { $multiply: [10, '$a', '$b'] },
            $subtract   : { $subtract: ['$a', '$b'] }
        }
    }
]);
// => [{ "add": 5, "divide": 0.5, "mod": 1, "multiply": 20, "$subtract": -1 }]
```

##### Boolean
 
 Name     | Version | Syntax | Description
 -------- | ------- | ------ | ------------
 $and     |  0.1.0  | `<field> : { $and: [ <expr1>, <expr2>, ... ]}` | Returns true only when __all__ its expressions evaluate to true. Accepts any number of argument expressions.
 $or      |  0.1.0  | `<field> : { $or: [ <expr1>, <expr2>, ... ]}` | Returns true when __any__ of its expressions evaluates to true. Accepts any number of argument expressions.
 $not     |  0.1.0  | `<field> : { $not: <expression> }` | Returns the boolean value that is the opposite of its argument expression. Accepts a single argument expression.

Example : 
```javascript
_( [
    {a: false, b: false },
    {a: false, b: true },
    {a: true,  b: false },
    {a: true,  b: true }
]).aggregate([
    {
        $project : {
            a   : 1,
            b   : 1,
            and : { $and: ['$a', '$b'] },
            or  : { $or: ['$a', '$b'] },
            notA: { $not: '$a' },
            notB: { $not: '$b' }
        }
    }
]);
// =>  [
//    { "a": false, "b": false, "and": false, "or": false, "notA": true,  "notB": true },
//    { "a": false, "b": true,  "and": false, "or": true,  "notA": true,  "notB": false},
//    { "a": true,  "b": false, "and": false, "or": true,  "notA": false, "notB": true },
//    { "a": true,  "b": true,  "and": true,  "or": true,  "notA": false, "notB": false}
// ]
```

##### Comparison
 
 Name     | Version | Syntax | Description
 -------- | ------- | ------ | ------------
 $eq      |  0.1.0  | `<field> : { $eq: [ <expr1>, <expr2> ]}` | Returns true if the values are equivalent.
 $ne      |  0.1.0  | `<field> : { $ne: [ <expr1>, <expr2> ]}` | Returns true if the values are __not__ equivalent.
 $gt      |  0.1.0  | `<field> : { $gt: [ <expr1>, <expr2> ]}` | Returns true if the first value is __greater__ than the second.
 $gte     |  0.1.0  | `<field> : { $gte: [ <expr1>, <expr2> ]}` | Returns true if the first value is __greater or equal__ to the second.
 $lt      |  0.1.0  | `<field> : { $lt: [ <expr1>, <expr2> ]}` | Returns true if the first value is __less__ than the second.
 $lte     |  0.1.0  | `<field> : { $lte: [ <expr1>, <expr2> ]}` | Returns true if the first value is __less or equal__ to the second.

Example : 
```javascript
_([{ a: 1, b: 2 }]).aggregate([
    {
        $project : {
            eq: { $eq: ['$a', '$b'] },
            ne: { $ne: ['$a', '$b'] },
            gt: { $gt: ['$a', '$b'] },
            gte: { $gte: ['$a', '$b'] },
            lt: { $lt: ['$a', '$b'] },
            lte: { $lte: ['$a', '$b'] }
        }
    }
]); 
// => [{
//    "eq": false,    
//    "ne": true,      
//    "gt": false,
//    "gte": false,   
//    "lt": true,   
//    "lte": true  
// }]
```

##### Array

 Name     | Version | Syntax | Description
 -------- | ------- | ------ | ------------
 $size    |  0.1.0  | `<field> : { $size: <expression> }` | Returns the number of elements in the array. Accepts a single expression as argument.

Example : 
```javascript
_([{ array: _.range(10) }]).aggregate([
    {
        $project : {
            len: { $size: '$array' }
        }
    }
]); // => [{ "len": 10 }]
```

##### String

 Name     | Version | Syntax | Description
 -------- | ------- | ------ | ------------
 $substr    |  0.1.0  | `<field> : { $substr: [ <expr1>, <expr2>, <expr3> ] }` | Returns a substring of a string, starting at a specified index position up to a specified length. Accepts three expressions as arguments: the first argument must resolve to a string, and the second and third arguments must resolve to integers.
 $format    |  0.1.0  | `<field> : { $format: [ <expr1>, <expr2>, ... ] }` | Returns a string formated according to replacement arguments. Accepts any number of argument expressions.
 $toLower    |  0.1.0  | `<field> : { $toLower: <expression> }` | Converts a string to lowercase. Accepts a single argument expression.
 $toUpper    |  0.1.0  | `<field> : { $toUpper: <expression> }` | Converts a string to uppercase. Accepts a single argument expression.

Example : 
```javascript
_([{ hello: 'Hello', world: 'World' }]).aggregate([
    {
        $project : {
            format1: { $format: ['{hello} {world}!'] },
            format2: { $format: ['{0} {1}!', '$hello', '$world'] },
        }
    },
    {
        $project : {
            hello: { $substr: [ '$format1', 0, 5 ] } ,
            world: { $substr: [ '$format2', 6, 5 ] } ,
            format1: { $toLower: '$format1' },
            format2: { $toUpper: '$format2' }
        }
    }
]); 
// => [{   
//      "hello": "Hello",
//      "world": "World",
//      "format1": "hello world!",
//      "format2": "HELLO WORLD!"
//  }]
```


##### Date

 Name         | Version | Syntax | Description
 ------------ | ------- | ------ | ------------
 $dayOfMonth  |  0.1.0  | `<field> : { $dayOfMonth: <expression> }` | Returns the [day of the month](http://momentjs.com/docs/#/get-set/date/) for a date as a number between 1 and 31. Accepts a single argument expression resolving a [moment](http://momentjs.com/) object.
 $dayOfWeek   |  0.1.0  | `<field> : { $dayOfWeek: <expression> }` | Returns the [day of the week (Locale Aware)](http://momentjs.com/docs/#/get-set/weekday/) as a number between 0 and 6 __according to the locale__. Accepts a single argument expression resolving a [moment](http://momentjs.com/) object.
 $dayOfYear   |  0.1.0  | `<field> : { $dayOfYear: <expression> }` | Returns the [day of the year](http://momentjs.com/docs/#/get-set/day-of-year/) as a number between 1 and 366. Accepts a single argument expression resolving a [moment](http://momentjs.com/) object.
 $hour        |  0.1.0  | `<field> : { $hour: <expression> }` | Returns the [hour](http://momentjs.com/docs/#/get-set/hour/) as a number beetween 0 and 23. Accepts a single argument expression resolving a [moment](http://momentjs.com/) object.
 $millisecond |  0.1.0  | `<field> : { $millisecond: <expression> }` | Returns the [millisecond](http://momentjs.com/docs/#/get-set/millisecond/) as a number between 0 and 999. Accepts a single argument expression resolving a [moment](http://momentjs.com/) object.
 $minute      |  0.1.0  | `<field> : { $minute: <expression> }` | Returns the [minute](http://momentjs.com/docs/#/get-set/minute/) as a number between 0 and 59. Accepts a single argument expression resolving a [moment](http://momentjs.com/) object.
 $month       |  0.1.0  | `<field> : { $month: <expression> }` | Returns the [month](http://momentjs.com/docs/#/get-set/month/) as a number between 0 and 11. Accepts a single argument expression resolving a [moment](http://momentjs.com/) object. __Note__: Months are zero indexed, so January is month 0.
 $second      |  0.1.0  | `<field> : { $second: <expression> }` | Returns the [second](http://momentjs.com/docs/#/get-set/second/) as a number between 0 and 59. Accepts a single argument expression resolving a [moment](http://momentjs.com/) object. 
 $week        |  0.1.0  | `<field> : { $week: <expression> }` | Returns the [week (Locale aware)](http://momentjs.com/docs/#/get-set/week/) as a number between 1 and 53. Accepts a single argument expression resolving a [moment](http://momentjs.com/) object. 
 $year        |  0.1.0  | `<field> : { $year: <expression> }` | Returns the [year](http://momentjs.com/docs/#/get-set/year/) as a number. Accepts a single argument expression resolving a [moment](http://momentjs.com/) object. 
 $format      |  0.1.0  | `<field> : { $format: [ <expr1>, <expr2> ]}` | Returns the date as a string formated according to the specified format. Accepts three expressions as arguments: the first argument must resolve to a [moment](http://momentjs.com/)  object and the second (optional) must resolve to a string. See [moment's documentation](http://momentjs.com/docs/#/displaying/) for more information.
 $parse       |  0.1.0  | `<field> : { $parse: <expression> }` | Create a [moment date]() object from the specified expression. Accepts a single argument expression resolving a number or a string.

Example : 
```javascript
_([{ date: '1987-04-30 12:15:59.123' }]).aggregate([
    {
        $project : {
            date: { $parse: '$date' }
        }
    },
    {
        $project : {
            dayOfMonth: { $dayOfMonth: '$date' },
            dayOfWeek: { $dayOfWeek: '$date' },
            dayOfYear: { $dayOfYear: '$date' },
            hour: { $hour: '$date' },
            millisecond: { $millisecond: '$date' },
            minute: { $minute: '$date' },
            month: { $month: '$date' },
            second: { $second: '$date' },
            week: { $week: '$date' },
            year: { $year: '$date' },
            format: { $format: ['$date', 'LT' ] }
        }
    }
]); 
// => [{ 
//    "dayOfMonth": 30, 
//    "dayOfWeek": 4, 
//    "dayOfYear": 120, 
//    "hour": 12, 
//    "millisecond": 123, 
//    "minute": 15, 
//    "month": 3, 
//    "second": 59,  
//    "week": 18, 
//    "year": 1987, 
//    "format": "12:15 PM" 
// }];
```

## Credits
Largely inspired by the great work of [mongodb](http://www.mongodb.org/)'s community.

## License
Released under the terms of MIT License:

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.