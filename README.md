# js-codex

Encode and decode modern JavaScript, e.g. Map, Set, NaN, Infinity, typed Arrays for `JSON.stringify` and `JSON.parse`.

`JSON.stringify` and `JSON.parse` are of high utility for serializing JSON data and restoring it for later use. However,
they were both designed prior to the introduction of a large number of JavaScript objects that do not serialize and
subsequently restore well, i.e. `Set`, `Map`, `URL`, `BigInt`, `GeolocationCoordinates`, `GeolocationPosition` and 
all of the typed arrays like `Int8Array`.

The library also handles a number of items that have never been addressed well by `JSON.stringify` and `JSON.parse`: 
`Infinity`, `-Infinity`, `NaN`, `undefined`.

Finally, `JSON.stringify` loses semantic information unless `toJSON` methods are implemented for each class. The `js-codex` library solves this
problem and supports serializaton preparation for all native JavaScript classes and automatically learns custom classes without semantic loss.

# Usage

Here is an example that covers many special JavaScript cases and classes as well as a custom class:

```
<script type="module">
	import {Codex} from "../js-codex.js";

	const codex = new Codex(),
		Person = function(config={}) {
			Object.assign(this,config);
			// create hidden metadata property
			Object.defineProperty(this,"^",{value:Object.assign({},config["^"])});
			// add a unique id, if one does not exist
			if(!this["#"]) {
				this["#"] = `Person@${Math.random()}`; // good enough for demo
			}
			// set the createdAt metadata, if it does not exist
			if(!this["^"].createdAt) {
				this["^"].createdAt = new Date();
			}
		},
		data = {
			anUndefined: undefined,
			aBoolean: true,
			aNumber: 1,
			aString: "a string",
			aDate: new Date(),
			aBigInt: BigInt("9007199254740991"),
			aCustomObject: new Person({name:"joe"}),
			aSet: [1,NaN,Infinity,undefined]
				.reduce((accum,value) => accum.add(value),new Set()),
			aMap: [["a",1],["b",NaN],["c",Infinity],["d",undefined],[{name:"test"},{name:"test"}]]
				.reduce((accum,[key,value]) => accum.set(key,value),new Map()),
			anInt8Array: Int8Array.from([1,2,3]),
			aBigInt64Array: BigInt64Array.from([9007199254740991n,"9007199254740991"])
		};
	navigator.geolocation.getCurrentPosition(async (location) => {
		const references = {};
		data.aGeolocation = location;
		const encoded = codex.encode(data,{idProperty:"#",references,hiddenProperties:["^"]});
		console.log(encoded);
		console.log(await codex.decode(JSON.parse(JSON.stringify(encoded)),{references}));
	});
</script>
```

# API

The API is presented in order of likely use.

## declare({ctor,name=ctor.name,decode,create,encode})

Extends codex to support the named class. The core encoder will automatically learn new classes based on the instances it is passed. If
the same Codex instance is used for decoding, `declare` will not usually be needed. However, if you are decoding on a remote device,
then you will nned to provide the functions for the Codex to use.

`ctor` - The class constructor.

`name` - Classname for which to support encoding and decoding.

`decode` - Optional. Function to decode class. Has the same signature as `decode` below. If not provided an attempt with by made to create
an instance using a `create` function passed all the decoded data as an `Object`. If no create function can be found, then `Object.create`
is used with the class prototype and the data is assigned to the instance.

`create` - Optional. Factory function to create an instance based on a single config object containing all decoded data. May be asynchronous.
If not provided and needed a search for a factory will be conducted by looking at the class to see if it has a static method `create`.

`encode` - Optional. Function to encode class instance. Has the same signature as `encode` below. If not provided, a search will be made
by first looking for an `encode` method on the data passed to `encode` and next for a static method named `encode` on the class of the
data passed to `encode`.

## encode(data,{idProperty,hiddenProperties=[],references}={})

Encodes the data so it can be serialized using `JSON.stringify`. Supports circular references so long as the objects referenced have an `idProperty`.

`data` - The data to encode. Can be anything including `undefined`.

`idProperty` - Optional. The key in which unique object identifiers are stored, e.g. `_id` or `#`.

`hiddenProperties` - Optional. An array of hidden, i.e. non-enumerable, property names to include in the encoded data.

`references` - An object, the entries of which will be unique object ids and objects when `encode` returns.

## async decode(data,{isReference,references}={})

Decodes data. It is asynchronous because decoding data will frequently require asynchronous retrieval of referenced objects from a database
based on their ids.

`data` - The data to decode. Can be anything.

`isReference(value)` - A function that returns truthy if the value passed is an object reference, i.e. an id pulled from the `idProperty` field
specified with `encode`.

`references` - Either a function or an object. If a function, when passed a unique object id it should return the object. It may be asynchronous. 
Typically, this will be a database getter. Or, an object, the keys of which are unique object ids and the values are objects to substitute
for the ids, e.g. the `references` object populated by `encode`.

# License

MIT

# Release History (reverse chronologicla order)

2020-02-17 v0.0.4a ALPHA Added `URL` as an ecodable class. Added unit tests.

2020-02-16 v0.0.3a ALPHA Fixed issues with BigInt Arrays and Uint32Array. Added unit tests.

2020-02-16 v0.0.2a ALPHA Corrected typo in declare function signature.

2020-02-16 v0.0.1a ALPHA Initial public release


