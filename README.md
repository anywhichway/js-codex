# js-codex

JSON.stringify/parse, encode, and decode modern JavaScript, e.g. Map, Set, NaN, Infinity, typed Arrays.

`JSON.stringify` and `JSON.parse` are of high utility for serializing JSON data and restoring it for later use. However,
they were both designed prior to the introduction of a large number of JavaScript objects that do not serialize and
subsequently restore well, i.e. `Set`, `Map`, `URL`, `BigInt`, `GeolocationCoordinates`, `GeolocationPosition` and 
all of the typed arrays like `Int8Array`.

`Js-codex` also handles a number of items that have never been addressed well by `JSON.stringify` and `JSON.parse`: 
`Infinity`, `-Infinity`, `NaN`, `undefined`, functions.

Finally, `JSON.stringify` loses semantic information unless `toJSON` methods are implemented for each class. The `js-codex` library solves this
problem and supports serializaton for all native JavaScript classes and automatically learns custom classes without semantic loss.

# Usage

Here is an example that covers many special JavaScript cases and classes as well as a custom class. `Codex` can encode any
JavaScript object in a manner that can be stringified, transported, parsed, and decoded back to its original form.

```javascript
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
			aFunction: Person,
			aSet: [1,NaN,Infinity,undefined]
				.reduce((accum,value) => accum.add(value),new Set()),
			aMap: [["a",1],["b",NaN],["c",Infinity],["d",undefined],[{name:"test"},{name:"test"}]]
				.reduce((accum,[key,value]) => accum.set(key,value),new Map()),
			anInt8Array: Int8Array.from([1,2,3]),
			aBigInt64Array: BigInt64Array.from([9007199254740991n,"9007199254740991"])
		};
	if(window.location.href.startsWith("https:") {
		navigator.geolocation.getCurrentPosition(async (location) => {
			const references = {};
			data.aGeolocation = location;
			const encoded = codex.encode(data,{idProperty:"#",references,hiddenProperties:["^"],functions:true});
			console.log(encoded);
			console.log(await codex.decode(JSON.parse(JSON.stringify(encoded)),{references}));
		});
	} else {
		const encoded = codex.encode(data,{idProperty:"#",references,hiddenProperties:["^"],functions:true});
		console.log(encoded);
		console.log(await codex.decode(JSON.parse(JSON.stringify(encoded)),{references,functions:true}));
	}
</script>
```

# Using with JSON.stringify and JSON.parse

Just pass in the `js-codex` `replacer()`  and `reviver()` function as the second argument to `JSON.stringify` or `JSON.parse`:

```javascript
<script type="module">
	import {Codex} from "../js-codex.js";
	
	(async () => {
		const codex = new Codex(),
			array = Uint16Array.from([1,2,3]),
			stringified = JSON.stringify(array,codex.replacer()),
			parsed = await JSON.parse(stringified,codex.reviver());
		console.log(array,stringified,parsed);
	})();
</script>
```

Note, `JSON.parse` returns a `Promise` when used with a `js-codex` reviver. This is because the reviver can be configured to use asynchronous 
calls to restore objects by reference from databases.

# Initializing the Codex

The codex can be configured with a default object id property, a function to identify object ids, a list of hidden/non-enumerable properties 
(object ids are often non-enumerable), and a collector/restorer for object references.

TO BE WRITTEN

# Using With A Database

TO BE WRITTEN

# API

The API is presented in order of likely use.

## declare({ctor,name=ctor.name,decode,create,encode})

Extends codex to support the named class. The core encoder will automatically learn new classes based on the instances it is passed. If
the same Codex instance is used for decoding, `declare` will not usually be needed. However, if you are decoding on a remote device,
then you will nned to provide the functions for the Codex to use.

`ctor` - The class constructor.

`name` - Classname for which to support encoding and decoding.

`decode` - Optional. Function to decode class. Has the same signature as `decode` below. If not provided an attempt with be made to create
an instance using a `create` function defined as a static member of `ctor` and passed all the decoded data as an `Object`. If no create function 
can be found, then `Object.create` is used with the class prototype and the data is assigned to the instance.

`create` - Optional. Factory function to create an instance based on a single config object containing all decoded data. May be asynchronous.
If not provided and needed, a search for a factory will be conducted by looking at the `ctor` to see if it has a static method `create`.

`encode` - Optional. Function to encode class instance. Has the same signature as `encode` below. If not provided, a search will be made
by first looking for an `encode` method on the data passed to `encode` and next for a static method named `encode` on the class of the
data passed to `encode`.

## encode(data,{idProperty,hiddenProperties=[],references,functions}={})

Encodes the data so it can be serialized using `JSON.stringify`. Supports circular references so long as the objects referenced have an `idProperty`.

`data` - The data to encode. Can be anything including `undefined`.

`idProperty` - Optional. The key in which unique object identifiers are stored, e.g. `_id` or `#`.

`hiddenProperties` - Optional. An array of hidden, i.e. non-enumerable, property names to include in the encoded data.

`references` - If provided at an object when `encode` is invoked, the `references` will have entries consiting of unique object ids and objects when `encode` returns.

`functions` - Optional. If `true`, then functions are converetd to strings. Note, functions containing closure scoped variables may fail to operate
properly when decoded. Also, encoding,, transporting, decoding, and then executing functions has some security risks.

## async decode(data,{idProperty,isReference,references,functions}={})

Decodes data. It is asynchronous because decoding data will frequently require asynchronous retrieval of referenced objects from a database
based on their ids.

`data` - The data to decode. Can be anything.

`idProperty` - Optional. The key in which unique object identifiers are stored, e.g. `_id` or `#`.

`isReference(value)` - A function that returns truthy if the value passed is an object reference, i.e. an id pulled from the `idProperty` field
specified with `encode`.

`references` - Either a function or an object. If a function, when passed a unique object id it should return the object. It may be asynchronous. 
Typically, this will be a database getter. Or, an object, the keys of which are unique object ids and the values objects to substitute
for the ids, e.g. the `references` object populated by `encode`.

`functions` - Optional. If `true`, then functions are restored. Note, functions containing closure scoped variables may fail to operate
properly when decoded. Also, encoding,, transporting, decoding, and then executing functions has some security risks.

# License

MIT

# Release History (reverse chronologicla order)

2020-03-13 v0.0.7b BETA Added default JSON replacer and reviver. Enhanced documentation.

2020-03-10 v0.0.6b BETA Added function encoding/decoding. Enhanced documentation.

2020-02-28 v0.0.5a ALPHA Reworked internals to simplify.

2020-02-17 v0.0.4a ALPHA Added `URL` as an encodable class. Added unit tests.

2020-02-16 v0.0.3a ALPHA Fixed issues with BigInt Arrays and Uint32Array. Added unit tests.

2020-02-16 v0.0.2a ALPHA Corrected typo in declare function signature.

2020-02-16 v0.0.1a ALPHA Initial public release


