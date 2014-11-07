# Underscore.aggregate [![Build Status](https://travis-ci.org/nicolaspanel/underscore.aggregate.png)](https://travis-ci.org/nicolaspanel/underscore.aggregate)

Provide aggregation features that make your code easier to read and understand. 

__Basic example:__
```js
_([
    { level: 'warn',  date: '1999-12-31 23:59' },
    { level: 'debug', date: '2000-01-01 00:00' },
    { level: 'info',  date: '2000-01-01 01:00' },
    { level: 'warn',  date: '2000-01-01 02:00' },
    { level: 'error', date: '2000-01-01 03:00' },
    { level: 'error', date: '2000-01-01 03:30' },
    { level: 'info',  date: '2000-01-01 04:00' }
]).$project({
    level: 1, // <=> level : '$level'
    date: { $parse: '$date' }
}).$match({
    level: { $in: ['warn', 'error'] },
    date: {
        $gte: moment('2000-01-01 00:00'),
        $lt: moment('2000-01-02 00:00')
    }
}).$group({
    _id: '$level',
    count: { $sum: 1 },
    start: { $min: '$date' }
}).$project({
    level: '$_id',
    count: 1,
    startedAt: { $format: ['$start', 'LT']}
}).first(10).value();
// => [{
//     level: "warn",
//     count: 1,
//     startedAt: "2:00 AM"
// }, 
// {
//     level: "error",
//     count: 2,
//     startedAt: "3:00 AM"
// }]
```
[plnkr](http://plnkr.co/edit/k6SUjZLB2doM9WcghDA8?p=preview)

__Note:__ 
 - works on nested objects too.
 - `underscore.aggregate` functions return wrapped objects on which you can apply any of [underscorejs](http://underscorejs.org/) functions.

## Installation and usage
1. Choose your preferred method of installation:
 - Through bower: `bower install --save underscore.aggregate`
 - Download from Github: [underscore.aggregate.min.js](https://cdn.rawgit.com/nicolaspanel/underscore.aggregate/master/underscore.aggregate.min.js)

2. Include [underscore](http://underscorejs.org/), [moment](http://momentjs.com/) and [underscore.aggregate](#) in your application:
```html
<script src="components/moment/moment.js"></script>
<script src="components/underscore/underscore.js"></script>
<script src="components/underscore.aggregate/underscore.aggregate.min.js"></script> 
```

## Reference
_See [Quick Reference](#quick-reference) for a more compact overview._

Syntax: 
```javascript
_(collection)
   .<stage1>(<options1>)
   .<stage2>(<options2>)
   ...
   .value();
```
Supported functions are:
    - [$group](#group-v100) : groups collection items
    - [$match](#match-v100) : filters the collection
    - [$project](#project-v100): transforms collection items
    - [$objectify](#objectify-v120): Reduce items to a single object using `_key/_value` pairs
    - [$sort](#sort-v130): Returns items in sorted order

__Note:__

- `underscore.aggregate` functions start with '$'.
- `underscore.aggregate` functions return a wrapped object that can be used for further chaining.

### $group (_v1.0.0+_)

Usage: 
```javascript
_(collection).$group({ 
    _id: <expression>, 
    <field1>: { <accumulator1> : <expression1> }, 
    ... 
})...
```

See below for all supported [accumulators](#accumulators).

__Example:__
 
```javascript
_([
    { name: 'Maggie', gender: 'female', age: 2 },
    { name: 'Lisa',   gender: 'female', age: 8 },
    { name: 'Bart',   gender: 'male' ,  age: 10 },
    { name: 'Homer',  gender: 'male' ,  age: 38 },
    { name: 'Marge',  gender: 'female', age: 40 }
]).$group({
    _id: '$gender', // group by gender
    count: { $sum: 1 },
    avgAge : { $avg: '$age' },
    maxAge : { $max: '$age' },
    minAge : { $min: '$age' },
    names :  { $addToSet: '$name'}
});

// =>[
//    { "_id": "female", "count": 3, "avgAge": 16.67, "maxAge": 40, "minAge": 2 , "names": [ "Maggie", "Lisa", "Marge" ] },
//    { "_id": "male",   "count": 2, "avgAge": 24,    "maxAge": 38, "minAge": 10, "names": [ "Bart", "Homer" ] }
// ]  
```


### $match (_v1.0.0+_)
_alias:_ __$filter__, __$where__

Filters the items that match the specified condition(s).

Usage: 
```javascript
_(collection).$match({ 
    <query1>, 
    <query2>, 
    ... 
})...
```

__Supported syntax for queries :__

Syntax                  | Version | Description
----------------------- | ------- | ------------
```<field>: <expression>```  |  1.0.0+ | Matches items for which `field` value equals to expression evaluation. 
```<field>: { <operator>: <expression> }```  |  1.0.0+ | Matches items for which `field` value satisfy operator's condition.
```<field>: { <operator>: [ <expr1>, <expr2>, ... ] }```  |  1.0.0+ | Matches items for which `field` value satisfy operator's conditions
```<operator>: [ <query1>, <query2>, ... ]```  |  1.0.0+ | Matches items for which `operator` conditions are satisfied 

__Note:__ Default operator for queries is `$eq`. Syntax like `{ <field>: <expression> } }` are evaluated as `{ <field>: { $eq: <expression> } }`


__Supported Operators:__

Name     | Version | Syntax                                          | Description
-------- | ------- | ----------------------------------------------- | ---------------------------------------------
$gt      | 1.0.0+  | ```{ field: {$gt: <expression> } }```               | Matches values that are __greater than__ the value specified in the query. Supports both numbers and dates.
$gte     | 1.0.0+  | ```{ field: {$gte: <expression> } }```              | Matches values that are __greater than or equal to__  the value specified in the query. Supports both numbers and dates.
$lt      | 1.0.0+  | ```{ field: {$lt: <expression> } }```               | Matches values that are __less than__ the value specified in the query. Supports both numbers and dates.
$lte     | 1.0.0+  | ```{ field: {$lte: <expression> } }```              | Matches values that are __less than or equal to__  the value specified in the query. Supports both numbers and dates.
$in      | 1.0.0+  | ```{ field: { $in: [<expr1>, <expr2>, ... ] } }```  | Matches any of the values that __exist__ in the specified array.
$nin     | 1.0.0+  | ```{ field: { $nin: [<expr1>, <expr2>, ... ] } }``` | Matches values that __do not__ exit in the specified array.
$eq      | 1.0.0+  | ```{ field: {$eq: <expression> } }```               | Matches all values that are __equal__ to the specified value.
$ne      | 1.0.0+  | ```{ field: {$ne: <expression> } }```               | Matches all values that are __not equal__ to the specified value.
$and     | 1.0.0+  | ```{ $and: [ { <query1> }, { <query2> } , ... ] }```| Matches all values that satisfy __all__ given queries.
$or      | 1.0.0+  | ```{ $or: [ { <query1> }, { <query2> } , ... ] } ```| Matches all values that satisfy __any__ of the given queries.
$nor     | 1.0.0+  | ```{ $nor: [ { <query1> }, { <query2> } , ... ] }```| Matches all values that __do not__ satisfy __any__ of the given queries.
$regex   | 1.0.0+  | ```{ field: {$regex: <RegExp> } }```                | Matches all values that __match__ the given pattern.



__Example:__

```javascript
_([
    { level: 'warn',  date: moment('1999-12-31 23:59') },
    { level: 'debug', date: moment('2000-01-01 00:00') },
    { level: 'info',  date: moment('2000-01-01 01:00') },
    { level: 'warn',  date: moment('2000-01-01 02:00') },
    { level: 'error', date: moment('2000-01-01 03:00') },
    { level: 'info',  date: moment('2000-01-01 04:00') }
]).$match({
    level: { $in: ['warn', 'error'] },
    date: { $gt: moment('2000-01-01 02:00') },
}).first();  // => { level: 'error', date: {...} }
```


#### $project (_v1.0.0+_)
_alias:_ __$map__

Transform input item for the next stage. 
The specified fields can be existing fields from the input object or newly computed fields.


Usage: 
```javascript
_(collection).$project({ 
    <specification1>, 
    <specification2>, 
    ... 
});
```


__Supported syntax for specifications :__


Syntax                      | Version | Description
--------------------------- | ------- | ------------
```<field>: <1 or true>```  | 1.0.0+  | Specify the inclusion of a field.
```<field>: <expression>``` | 1.0.0+  | Add a new field or reset the value of an existing field.



Example:
```javascript
_([{
    name: 'Homer Simpson',
    gender: 'male' ,
    address : { n: 742, road: 'Evergreen Terrace', city: 'Springfield' },
    birthday: moment('1955-05-12')
}]).$project({
    name : 1,
    address: { $format: '{address.n} {address.road}, {address.city}' },
    age : { $diff: [ moment(), '$birthday', 'years' ] }
}).first();
// => {   
//    name: "Homer Simpson", 
//    address: "742 Evergreen Terrace, Springfield", 
//    age: 59 
// }
```

__Note:__ See [expressions](#expressions) for more information about options. 

#### $objectify (_v1.2.0+_)
Reduce items to a single object using `_key/_value` pairs

Usage: 
```javascript
_(collection).$objectify({ _key: <expression>, _value: <expression> });
```

__Notes:__
 - Default values are `{ _key: '$_id', _value: '$' }`.
 - `_key` expression must resolve to a unique value for each item.

Example: 
```javascript
_([
    { type: 'a', count : 1 },
    { type: 'b', count: 2 },
    { type: 'c', count: 3 }
]).$objectify({ _key: '$type', _value: '$count'}).value(); // => { a: 1, b: 2, c: 3 }
```


#### $sort (_v1.3.0+_)
_alias:_ __$order__, __$sortBy__, __$orderBy__

Returns items in sorted order.

Takes an object that specifies the field to sort by and the respective sort order. `<sort order>` can have one of the following values:
 - `1` to specify ascending order.
 - `-1` to specify descending order.


Usage: 
```javascript
_(collection).$sort({ <field>: <sort order> });
```

Example: 
```javascript
_([
    { type: 'a', count : 3 },
    { type: 'b', count: 1 },
    { type: 'c', count: 2 }
]).$sort({ count: -1 }).value(); 
// => [
//     { type: 'a', count : 3 },
//     { type: 'c', count: 2 },
//     { type: 'b', count: 1 }
// ]
```

### Expressions
Expressions can include :
 - [Field paths](#field-paths-expressions)
 - [Literals](#literal-expressions)
 - [Accumulators](#accumulators)
 - [Arithmetic operators](#arithmetic)
 - [Boolean operators](#boolean)
 - [Comparison operators](#comparison)
 - [Array operators](#array)
 - [String operators](#string)
 - [Date operators](#date)

#### Field paths expressions
Use `$<field>" to specify the field path.

Field pass expressions can be nested. Example: `$foo.bar`.

#### Literal expressions
They can be of any type. However, `underscore.aggregate` parses string literals that start with a dollar sign `$` as a path to a field and numeric/boolean literals in expression objects as projection flags. 
To avoid parsing literals, use the `$literal` expression.

Example : `foo : { $literal : <value> }`

#### Operator expressions
They are similar to functions that take arguments. In general, these expressions take an array of arguments and have the following form: `{ <operator>: [ <argument1>, <argument2> ... ] }`. 
If operator accepts a single argument, you can omit the outer array designating the argument list: `{ <operator>: <argument> }`.

Available operators are listed bellow.

##### Accumulators

Note: accumulators are available __only__ for [$group](#group-v100) stage.

Name      | Version | Description
--------- | ------- | ------------
$sum      |  1.0.0+ | Returns a sum for each group. Ignores non-numeric values.
$avg      |  1.0.0+ | Returns an average for each group. Ignores non-numeric values.
$first    |  1.0.0+ | Returns a value from the first document for each group..
$max      |  1.0.0+ | Returns the highest expression value for each group.
$min      |  1.0.0+ | Returns the lowest expression value for each group.
$any      |  1.0.0+ | Returns true if any elements of a set evaluate to true; otherwise, returns false.
$addToSet |  1.0.0+ | Returns an array of unique expression values for each group. Order of the array elements is undefined.
$fn       |  1.0.0+ | Compute custom value based on group items.

__Example:__
 
```javascript
_([
    { name: 'Maggie', gender: 'female', age: 2 },
    { name: 'Lisa',   gender: 'female', age: 8 },
    { name: 'Bart',   gender: 'male' ,  age: 10 },
    { name: 'Homer',  gender: 'male' ,  age: 38 },
    { name: 'Marge',  gender: 'female', age: 40 }
]).$group{
    _id: '$gender',
    count: { $sum: 1 },
    avgAge : { $avg: '$age' },
    maxAge : { $max: '$age' },
    minAge : { $min: '$age' },
    names :  { $addToSet: '$name'}
}).value();

// =>[
//    { "_id": "female", "count": 3, "avgAge": 16.67, "maxAge": 40, "minAge": 2 , "names": [ "Maggie", "Lisa", "Marge" ] },
//    { "_id": "male",   "count": 2, "avgAge": 24,    "maxAge": 38, "minAge": 10, "names": [ "Bart", "Homer" ] }
// ]  
```

##### Arithmetic

 Name      | Version | Description
 --------- | ------- | ------------
 $add      |  1.0.0+ | Adds numbers to return the sum. Accepts any number of argument expressions.
 $divide   |  1.0.0+ | Returns the result of dividing the first number by the second. Accepts two argument expressions.
 $mod      |  1.0.0+ | Returns the remainder of the first number divided by the second. Accepts two argument expressions.
 $multiply |  1.0.0+ | Multiplies numbers to return the product. Accepts any number of argument expressions.
 $subtract |  1.0.0+ | Returns the result of subtracting the second value from the first.  Accepts two argument expressions.

Example : 
```javascript
_([{ a: 1, b: 2 }]).$project({
    add         : { $add: ['$a', '$b', 2] },
    divide      : { $divide: ['$a', '$b'] },
    mod         : { $mod: ['$a', '$b'] },
    multiply    : { $multiply: [10, '$a', '$b'] },
    $subtract   : { $subtract: ['$a', '$b'] }
}).value();
// => [{ "add": 5, "divide": 0.5, "mod": 1, "multiply": 20, "$subtract": -1 }]
```

##### String

 Name     | Version | Description
 -------- | ------- | ------------
 $substr  | 1.0.0+  | Returns a substring of a string, starting at a specified index position up to a specified length. Accepts three expressions as arguments: the first argument must resolve to a string, and the second and third arguments must resolve to integers.
 $format  | 1.0.0+  | Returns a string formated according to replacement arguments. Accepts any number of argument expressions.
 $toLower | 1.0.0+  | Converts a string to lowercase. Accepts a single argument expression.
 $toUpper | 1.0.0+  | Converts a string to uppercase. Accepts a single argument expression.

Example : 
```javascript
_([
    { hello: 'Hello', world: 'World' }
]).$project({
    format1: { $format: ['{hello} {world}!'] },
    format2: { $format: ['{0} {1}!', '$hello', '$world'] },
}).$project({
    hello: { $substr: [ '$format1', 0, 5 ] } ,
    world: { $substr: [ '$format2', 6, 5 ] } ,
    format1: { $toLower: '$format1' },
    format2: { $toUpper: '$format2' }
}).first(); 
// => {   
//      "hello": "Hello",
//      "world": "World",
//      "format1": "hello world!",
//      "format2": "HELLO WORLD!"
//  ]
```


##### Boolean
 
 Name     | Version | Description
 -------- | ------- | ------------
 $and     | 1.0.0+  | Returns true only when __all__ its expressions evaluate to true. Accepts any number of argument expressions.
 $or      | 1.0.0+  | Returns true when __any__ of its expressions evaluates to true. Accepts any number of argument expressions.
 $not     | 1.0.0+  | Returns the boolean value that is the opposite of its argument expression. Accepts a single argument expression.

Example : 
```javascript
_( [
    {a: true,  b: false }
]).$project({
    a   : 1,
    b   : 1,
    and : { $and: ['$a', '$b'] },
    or  : { $or: ['$a', '$b'] },
    notA: { $not: '$a' },
    notB: { $not: '$b' }
}).$project : {
    and : { $format: ['{a} and {b} => {and}'] },
    or  : { $format: ['{a} or {b} => {or}'] },
    notA: { $format: ['not {a}  => {notA}'] },
    notB: { $format: ['not {b} => {notB}'] }
}).first();
// =>  {
//    and : "true and false => false",
//    or  : "true or false => true",
//    notA: "not true => false",
//    notB: "not false => true"
// }
```

##### Comparison
 
__Note:__ all comparison operators accept two argument expressions: `<operator>: [ <expr1>, <expr2> ]`
 
 Name     | Version | Description
 -------- | ------- | ------------
 $eq      | 1.0.0+  | Returns true if the values are equivalent.
 $ne      | 1.0.0+  | Returns true if the values are __not__ equivalent.
 $gt      | 1.0.0+  | Returns true if the first value is __greater__ than the second.
 $gte     | 1.0.0+  | Returns true if the first value is __greater or equal__ to the second.
 $lt      | 1.0.0+  | Returns true if the first value is __less__ than the second.
 $lte     | 1.0.0+  | Returns true if the first value is __less or equal__ to the second.

Example : 
```javascript
_([
    { a: 1, b: 2 }
]).$project({
    eq: { $eq: ['$a', '$b'] },
    ne: { $ne: ['$a', '$b'] },
    gt: { $gt: ['$a', '$b'] },
    gte: { $gte: ['$a', '$b'] },
    lt: { $lt: ['$a', '$b'] },
    lte: { $lte: ['$a', '$b'] }
}).first(); 
// => {
//    "eq": false,    
//    "ne": true,      
//    "gt": false,
//    "gte": false,   
//    "lt": true,   
//    "lte": true  
// }
```

##### Array

 Name     | Version | Description
 -------- | ------- | ------------
 $size    |  1.0.0+ | Returns the number of elements in the array. Accepts a single expression as argument.

Example : 
```javascript
_([
    { array: _.range(10) }
]).$project({ 
    len: { $size: '$array' }
}).first(); // => { len: 10 }
```


##### Date

 Name         | Version | Description
 ------------ | ------- | -----------
 $dayOfMonth  | 1.0.0+  | Returns the [day of the month](http://momentjs.com/docs/#/get-set/date/) for a date as a number between 1 and 31. Accepts a single argument expression resolving a [moment](http://momentjs.com/) object.
 $dayOfWeek   | 1.0.0+  | Returns the [day of the week (Locale Aware)](http://momentjs.com/docs/#/get-set/weekday/) as a number between 0 and 6 __according to the locale__. Accepts a single argument expression resolving a [moment](http://momentjs.com/) object.
 $dayOfYear   | 1.0.0+  | Returns the [day of the year](http://momentjs.com/docs/#/get-set/day-of-year/) as a number between 1 and 366. Accepts a single argument expression resolving a [moment](http://momentjs.com/) object.
 $hour        | 1.0.0+  | Returns the [hour](http://momentjs.com/docs/#/get-set/hour/) as a number beetween 0 and 23. Accepts a single argument expression resolving a [moment](http://momentjs.com/) object.
 $millisecond | 1.0.0+  | Returns the [millisecond](http://momentjs.com/docs/#/get-set/millisecond/) as a number between 0 and 999. Accepts a single argument expression resolving a [moment](http://momentjs.com/) object.
 $minute      | 1.0.0+  | Returns the [minute](http://momentjs.com/docs/#/get-set/minute/) as a number between 0 and 59. Accepts a single argument expression resolving a [moment](http://momentjs.com/) object.
 $month       | 1.0.0+  | Returns the [month](http://momentjs.com/docs/#/get-set/month/) as a number between 0 and 11. Accepts a single argument expression resolving a [moment](http://momentjs.com/) object. __Note__: Months are zero indexed, so January is month 0.
 $second      | 1.0.0+  | Returns the [second](http://momentjs.com/docs/#/get-set/second/) as a number between 0 and 59. Accepts a single argument expression resolving a [moment](http://momentjs.com/) object. 
 $week        | 1.0.0+  | Returns the [week (Locale aware)](http://momentjs.com/docs/#/get-set/week/) as a number between 1 and 53. Accepts a single argument expression resolving a [moment](http://momentjs.com/) object. 
 $year        | 1.0.0+  | Returns the [year](http://momentjs.com/docs/#/get-set/year/) as a number. Accepts a single argument expression resolving a [moment](http://momentjs.com/) object. 
 $format      | 1.0.0+  | Returns the date as a string formated according to the specified format. Accepts two expressions as arguments: the first argument must resolve to a [moment](http://momentjs.com/)  object and the second (optional) must resolve to a string. See [moment's documentation](http://momentjs.com/docs/#/displaying/) for more information.
 $parse       | 1.0.0+  | Create a [moment date]() object from the specified expression. Accepts a single argument expression resolving a number or a string.
 $valueOf     | 1.1.0+  | Returns the number of milliseconds since the Unix Epoch. Accepts a single argument expression resolving a [moment](http://momentjs.com/) date object.
 $diff        | 1.2.0+  | Returns the [difference](http://momentjs.com/docs/#/displaying/difference/) between two dates. Accepts four expression arguments. First and second arguments must resolve to a [moment](http://momentjs.com/) date object. Third argument must resolve a string (possible values are 'milliseconds', 'seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'years'. Default is 'milliseconds'). Fourth argument must resolve a boolean for floating point number (default : `false`).

Example : 
```javascript
_([
    { date: '1987-04-30 12:15:59.123' }
]).$project({
    date: { $parse: '$date' }
}).$project : {
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
}).first(); 
// => { 
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
// };
```

### Quick reference

 - __Stages__ :
   - $match : `_(collection).$match({  <query1>, <query2>, ... })`
   - $project: `_(collection).$project({ <spec1>, <spec2>, ... );` with `specification` formatted like  `<field>: <expression>`
   - $group : `_(collection).$group({ _id: <expression>, <field1>: { <accumulator1> : <expression1> }, ... );`.
   - $objectify: `_(collection).$objectify({ _key: <expression>, _value:<expression> });`
 - __Expressions__ :
   - Field paths: `<field>: '$path.to.attribute'`
   - Literals:    `<field>: 'toto'` or `<field>: { $literal: 'toto'}`
   - Accumulators (used by `$group` stage only):
     - `$sum: <expression>`
     - `$avg: <expression>`
     - `$first: <expression>`
     - `$last: <expression>`
     - `$max: <expression>`
     - `$min: <expression>`
     - `$addToSet: <expression>`
     - `$fn: <function(items)>`
   - Arithmetic operators :
     - `$add: [ <expr1>, <expr2>, ... ]`
     - `$divide: [ <expr1>, <expr2> ]`
     - `$mod: [ <expr1>, <expr2> ]`
     - `$multiply: [ <expr1>, <expr2>, ... ]`
     - `$subtract: [ <expr1>, <expr2> ]`
   - Boolean operators:
     - `$and: [ <expr1>, <expr2>, ... ]`
     - `$or: [ <expr1>, <expr2>, ... ]`
     - `$not: <expression>`
   - Comparison operators:
     - `$eq: [ <expr1>, <expr2> ]`
     - `$ne: [ <expr1>, <expr2> ]`
     - `$gt: [ <expr1>, <expr2> ]`
     - `$gte: [ <expr1>, <expr2> ]`
     - `$lt: [ <expr1>, <expr2> ]`
     - `$lte: [ <expr1>, <expr2> ]`
   - Array operators:
     - `$size: <expression>`
   - String operators
     - `$format: [ <expr1>, <expr2>, ... ]` or  `$format: <expression> ]`
     - `$substr: [ <expr1>, <expr2>, <expr3> ]`
     - `$toLower: <expression>`
     - `$toUpper: <expression>`
   - Date operators
     - `$dayOfMonth: <expression>`
     - `$dayOfWeek: <expression>`
     - `$dayOfYear: <expression>`
     - `$hour: <expression>`
     - `$millisecond: <expression>`
     - `$minute: <expression>`
     - `$month: <expression>`
     - `$second: <expression>`
     - `$week: <expression>`
     - `$year: <expression>`
     - `$format: [ <expr1>, <expr2> ]`
     - `$format: <expression>`
     - `$valueOf: <expression>`
     - `$diff: [ <expr1>, <expr2> [, <expr3> [, <expr4> ]] ]`
   - General purpose operators:
     - `$fn: <function(item)>`

## Contributions
Feel free to fork and improve `underscore.aggregate` in any way your want.

If you feel that the community will benefit from your changes, please send a [pull request](https://help.github.com/articles/using-pull-requests/) :
 - Fork the project.
 - Make your feature addition or bug fix.
 - Add documentation if necessary.
 - Add tests for it. This is important so I don't break it in a future version unintentionally (run tests using `grunt test` command).
 - Send a pull request to the `develop` branch.

## Credits
Largely inspired by the great work of [mongodb](http://www.mongodb.org/)'s community.

## License
Released under the terms of MIT License:

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
