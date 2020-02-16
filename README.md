# js-codex
Encode and decode modern JavaScript, e.g. Map, Set, for JSON.stringify and JSON.parse.

`JSON.stringify` and `JSON.parse` are of high utility for serializing JSON data and restoring it for later use. However,
they were both designed prior to the introduction of a large number of JavaScript objects that do not serialize and
subsequently restore well, i.e. `Set`, `Map`, all of the typed arrays like `Int8Array`. Additionally, `JSON.stringify`
loses semantic information unless `toJSON` methods are implemented for each class. The `js-codex` library solves this
problem and supports serializaton preparation for all native JavaScript classes and custom classes without semantic loss.

# Usage



# API

The API is presented in order of likely use.

## declare({name,decode,create,encode})

Extends codex to supprt the named class.

`name` - Classname for which to support encoding and decoding.

`decode` - Function to decode class. Has the same signature as `decode` below.

`create` - Factory function to create an instance based on a single config object containing all decoded data. May be asynchronous.

`encode` - Function to encode class instance. Has the same signature as `encode` below.

## encode(data,{idProperty,hiddenProperties=[],references}={})

Encodes the data so it can be serialized using `JSON.stringify`. Supports circular references so long as the objects referenced have an `idProperty`.

`data` - The data to encode. Can be anything including `undefined`.

`idProperty` - The key in which unique object identifiers are stored, e.g. `_id` or `#`.

`hiddenProperties` - Hidden, i.e. non-enumerable, properties to include in the encoded data.

`references` - An object, the entries of which will be unique object ids and objects when `encode` returns.

## decode(data,{isReference,references}={})

`data` - The data to decode. Can be anything.

`isReference(value)` - A function that returns truthy if the value passed is an object reference, i.e. an id pulled from the `idProperty` field
specified with `encode`.

`references` - Either a function or an object. If a function, when passed a unique object id will return the object. It may be asynchronous. 
Typically, this will be a database getter. Or, an object, the keys of which are unique object ids and the values, the objects to substitute
for the ids, e.g. the `references` object populated by `encode`.

# Release History (reverse chronologicla order)

2020-02-16 v0.0.1a ALPHA Initial public release


