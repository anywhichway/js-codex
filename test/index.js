import { expect } from 'chai';
import { Codex} from "../index.js";

describe("Test",function() {
	function Person(config={}) {
		Object.assign(this,config);
		Object.defineProperty(this,"^",{value:Object.assign({},config["^"])});
		if(!this["#"]) {
			this["#"] = `Person@${Math.random()}`; // good enough for demo
		}
		if(!this["^"].createdAt) {
			this["^"].createdAt = new Date();
		}
	};
	function Created(config={}) {
		Object.assign(this,config);
		Object.defineProperty(this,"^",{value:Object.assign({},config["^"])});
		if(!this["#"]) {
			this["#"] = `Created@${Math.random()}`; // good enough for demo
		}
		if(!this["^"].createdAt) {
			this["^"].createdAt = new Date();
		}
	};
	Created.create = function(config) {
		return new Created(config);
	};
	function Decodeable(config={}) {
		Object.assign(this,config);
	};
	Decodeable.create = function(config) {
		return new Decodeable(config);
	};
	let codex,
		replacer,
		reviver,
		simplecodex;
	before(() => {
		codex = new Codex({idProperty:"#",references:{},functions:true,hiddenProperties:["^"]});
		replacer = codex.replacer();
		reviver = codex.reviver();
		simplecodex = new Codex();
		simplecodex.register({name:"Decodeable",create:Decodeable.create})
	});
	it("boolean - false", async function() {
		const {kind,data} = codex.encode(false),
			decoded = await codex.decode({kind,data});
		expect(kind).equal("boolean");
		expect(data).equal(false);
		expect(decoded).equal(false);
	});
	it("boolean - false (stringify)", async function() {
		const stringified = JSON.stringify(false,replacer),
			{kind,data} = JSON.parse(JSON.parse(stringified)),
			parsed = await JSON.parse(stringified,reviver);
		expect(kind).equal("boolean");
		expect(data).equal(false);
		expect(parsed).equal(false);
	});
	it("boolean - true", async function() {
		const {kind,data} = codex.encode(true),
		decoded = await codex.decode({kind,data});
		expect(kind).equal("boolean");
		expect(data).equal(true);
		expect(decoded).equal(true);
	});
	it("boolean - true (JSON.stringify)", async function() {
		const stringified = JSON.stringify(true,replacer),
			{kind,data} = JSON.parse(JSON.parse(stringified)),
			parsed = await JSON.parse(stringified,reviver);
		expect(kind).equal("boolean");
		expect(data).equal(true);
		expect(parsed).equal(true);
	});
	it("number", async function() {
		const {kind,data} = codex.encode(1),
			decoded = await codex.decode({kind,data});
		expect(kind).equal("number");
		expect(data).equal(1);
		expect(decoded).equal(1);
	});
	it("number - (JSON.stringify)", async function() {
		const stringified = JSON.stringify(1,replacer),
			{kind,data} = JSON.parse(JSON.parse(stringified)),
			parsed = await JSON.parse(stringified,reviver);
		expect(kind).equal("number");
		expect(data).equal(1);
		expect(parsed).equal(1);
	});
	it("string", async function() {
		const {kind,data}  = codex.encode("a string"),
			decoded = await codex.decode({kind,data} );
		expect(kind).equal("string");
		expect(data).equal("a string");
		expect(decoded).equal("a string");
	});
	it("string - string (JSON.stringify)", async function() {
		const stringified = JSON.stringify("a string",replacer),
			{kind,data} = JSON.parse(JSON.parse(stringified)),
			parsed = await JSON.parse(stringified,reviver);
		expect(kind).equal("string");
		expect(data).equal("a string");
		expect(parsed).equal("a string");
	});
	it("undefined", async function() {
		const {kind,data} = codex.encode(),
			decoded = await codex.decode({kind,data});
		expect(kind).equal("undefined");
		expect(data).equal(undefined);
		expect(decoded).equal(undefined);
	});
	it("undefined - (JSON.stringify)", async function() {
		const stringified = JSON.stringify(undefined,replacer),
			{kind,data} = JSON.parse(JSON.parse(stringified)),
			parsed = await JSON.parse(stringified,reviver);
		expect(kind).equal("undefined");
		expect(data).equal(undefined);
		expect(parsed).equal(undefined);
	});
	it("bigint", async function() {
		const {kind,data}  = codex.encode(9007199254740991n),
			decoded = await codex.decode({kind,data} );
		expect(kind).equal("bigint");
		expect(data).equal("9007199254740991n");
		expect(decoded).equal(9007199254740991n);
	});
	it("bigint - (JSON.stringify)", async function() {
		const stringified = JSON.stringify(9007199254740991n,replacer),
			{kind,data} = JSON.parse(JSON.parse(stringified)),
			parsed = await JSON.parse(stringified,reviver);
		expect(kind).equal("bigint");
		expect(data).equal("9007199254740991n");
		expect(parsed).equal(9007199254740991n);
	});
	it("Infinity", async function() {
		const {kind,data}  = codex.encode(Infinity),
			decoded = await codex.decode({kind,data});
		expect(kind).equal("Infinity");
		expect(data).equal(undefined);
		expect(decoded).equal(Infinity);
	});
	it("Infinity - (JSON.stringify)", async function() {
		const stringified = JSON.stringify(Infinity,replacer),
			{kind,data} = JSON.parse(JSON.parse(stringified)),
			parsed = await JSON.parse(stringified,reviver);
		expect(kind).equal("Infinity");
		expect(data).equal(undefined);
		expect(parsed).equal(Infinity);
	});
	it("-Infinity", async function() {
		const {kind,data} = codex.encode(-Infinity),
			decoded = await codex.decode({kind,data});
		expect(kind).equal("-Infinity");
		expect(data).equal(undefined);
		expect(decoded).equal(-Infinity);
	});
	it("-Infinity - (JSON.stringify)", async function() {
		const stringified = JSON.stringify(-Infinity,replacer),
			{kind,data} = JSON.parse(JSON.parse(stringified)),
			parsed = await JSON.parse(stringified,reviver);
		expect(kind).equal("-Infinity");
		expect(data).equal(undefined);
		expect(parsed).equal(-Infinity);
	});
	it("NaN", async function() {
		const {kind,data} = codex.encode(NaN),
			decoded = await codex.decode({kind,data});
		expect(kind).equal("NaN");
		expect(data).equal(undefined);
		expect(decoded+"").equal("NaN");
	});
	it("NaN - (JSON.stringify)", async function() {
		const stringified = JSON.stringify(NaN,replacer),
			{kind,data} = JSON.parse(JSON.parse(stringified)),
			parsed = await JSON.parse(stringified,reviver);
		expect(kind).equal("NaN");
		expect(data).equal(undefined);
		expect(parsed+"").equal("NaN");
	});
	it("Date", async function() {
		const now = new Date(),
			{kind,data}  = codex.encode(now),
			decoded = await codex.decode({kind,data} );
		expect(kind).equal("Date");
		expect(data).equal(now.getTime());
		expect(decoded).instanceOf(Date);
		expect(decoded.getTime()).equal(now.getTime());
	});
	it("Date - (JSON.stringify)", async function() {
		const now = new Date(),
			stringified = JSON.stringify(now,replacer),
			{kind,data} = JSON.parse(JSON.parse(stringified)),
			parsed = await JSON.parse(stringified,reviver);
		expect(kind).equal("Date");
		expect(data).equal(now.getTime());
		expect(parsed).instanceOf(Date);
		expect(parsed.getTime()).equal(now.getTime());
	});
	[Int8Array,Uint8Array,Uint8ClampedArray,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array].forEach((array) => {
		const base = [1,2,3];
		it(array.name, async function() {
			const {kind,data}  = codex.encode(array.from(base)),
				decoded = await codex.decode({kind,data} );
			expect(kind).equal(array.name);
			expect(Array.isArray(data)).equal(true);
			expect(data.length).equal(3);
			expect(data.every((item,i) => base[i]===item)).equal(true);
			expect(decoded).instanceOf(array);
			expect(base.every((item,i) => decoded[i]===item)).equal(true);
		});
		it(`${array.name} - (JSON.stringify)`, async function() {
			const stringified = JSON.stringify(array.from(base),replacer),
				{kind,data} = JSON.parse(JSON.parse(stringified)),
				parsed = await JSON.parse(stringified,reviver);
			expect(kind).equal(array.name);
			expect(data.length).equal(3);
			expect(data.every((item,i) => base[i]===item)).equal(true);
			expect(parsed).instanceOf(array);
			expect(base.every((item,i) => parsed[i]===item)).equal(true);
		});
	});
	[BigInt64Array,BigUint64Array].forEach((array) => {
		const base = [1n,2n,3n];
		it(array.name, async function() {
			const {kind,data} = codex.encode(array.from(base)),
				decoded = await codex.decode({kind,data}  );
			expect(kind).equal(array.name);
			expect(Array.isArray(data)).equal(true);
			expect(data.length).equal(3);
			expect(data.every((item,i) => base[i]+""===item)).equal(true);
			expect(base.every((item,i) => decoded[i]===item)).equal(true);
		});
		it(`${array.name} - (JSON.stringify)`, async function() {
			const stringified = JSON.stringify(array.from(base),replacer),
				{kind,data} = JSON.parse(JSON.parse(stringified)),
				parsed = await JSON.parse(stringified,reviver);
			expect(kind).equal(array.name);
			expect(data.length).equal(3);
			expect(data.every((item,i) => base[i]+""===item)).equal(true);
			expect(base.every((item,i) => parsed[i]===item)).equal(true);
		});
	});
	it("Set", async function() {
		const base = [1,NaN,Infinity,undefined,{name:"joe"}],
			set = base.reduce((accum,value) => accum.add(value),new Set()),
			{kind,data} = codex.encode(set),
			decoded = await codex.decode({kind,data});
		expect(kind).equal("Set");	
		expect(data.length).equal(base.length);
		expect(decoded.size).equal(base.length);
		let i = 0;
		for(const item of decoded) {
			expect(JSON.stringify(item)).equal(JSON.stringify(base[i]));
			i++;
		}
	});
	it("Set - (JSON.stringify)", async function() {
		const base = [1,NaN,Infinity,undefined,{name:"joe"}],
			set = base.reduce((accum,value) => accum.add(value),new Set()),
			stringified = JSON.stringify(set,replacer),
			{kind,data} = JSON.parse(JSON.parse(stringified)),
			parsed = await JSON.parse(stringified,reviver);
		expect(kind).equal("Set");	
		expect(data.length).equal(base.length);
		expect(parsed).instanceOf(Set);
		expect(parsed.size).equal(base.length);
		let i = 0;
		for(const item of parsed) {
			if(item && typeof(item)==="obect") {
				expect(JSON.stringify(item)).equal(JSON.stringify(base[i]));
			} else {
				expect(item+"").equal(base[i]+"");
			}
			i++;
		}
	});
	it("Map", async function() {
		const base = [1,{name:"joe"}],
			map = base.reduce((accum,value) => accum.set(value,value),new Map()),
			{kind,data} = codex.encode(map),
			decoded = await codex.decode({kind,data});
		expect(kind).equal("Map");
		expect(data.length).equal(base.length);
		expect(decoded.size).equal(base.length);
		let i = 0;
		for(const [key,value] of decoded) {
			expect(JSON.stringify(value)).equal(JSON.stringify(base[i]));
			i++;
		}
	});
	it("Map  - (JSON.stringify)", async function() {
		const base = [1,{name:"joe"}],
			map = base.reduce((accum,value) => accum.set(value,value),new Map()),
			stringified = JSON.stringify(map,replacer),
			{kind,data} = JSON.parse(JSON.parse(stringified)),
			parsed = await JSON.parse(stringified,reviver);
		expect(kind).equal("Map");
		expect(data.length).equal(base.length);
		expect(parsed).instanceOf(Map);
		expect(parsed.size).equal(base.length);
		let i = 0;
		for(const item of parsed.values()) {
			expect(JSON.stringify(item)).equal(JSON.stringify(base[i]));
			i++;
		}
	});
	it("URL  - (JSON.stringify)", async function() {
		const href = "http://localhost/test.html?run=1",
			url = new URL(href),
			stringified = JSON.stringify(url,replacer),
			{kind,data} = JSON.parse(JSON.parse(stringified)),
			parsed = await JSON.parse(stringified,reviver);
		expect(kind).equal("URL");
		expect(data).equal(href);
		expect(parsed).instanceOf(URL);
		expect(parsed.href).equal(href);
	});
	it("Custom Decode", async function() {
		const decoded = await simplecodex.decode({kind:"Decodeable",data:{}});
		expect(decoded instanceof Decodeable).equal(true);
	});
	it("Custom Object", async function() {
		const person = new Person({name:"joe"}),
			references = {},
			hiddenProperties = ["^"],
			idProperty = "#",
			{kind,data} = codex.encode(person,{idProperty,hiddenProperties,references}),
			decoded = await codex.decode({kind,data},{references,idProperty,hiddenProperties});
		expect(kind).equal("Person");
		expect(decoded["#"]).equal(person["#"]);
		expect(decoded["^"].createdAt.getTime()).equal(person["^"].createdAt.getTime());
		expect(decoded instanceof Person).equal(true);
		expect(Object.getOwnPropertyDescriptor(decoded,"^").enumerable).equal(false);
	});
	it("Custom Object  - (JSON.stringify)", async function() {
		const person = new Person({name:"joe"}),
			references = {},
			hiddenProperties = ["^"],
			idProperty = "#",
			stringified = JSON.stringify(person,replacer),
			{kind,data} = JSON.parse(JSON.parse(stringified)),
			parsed = await JSON.parse(stringified,reviver);
		expect(kind).equal("Person");
		expect(parsed["#"]).equal(person["#"]);
		expect(parsed["^"].createdAt.getTime()).equal(person["^"].createdAt.getTime());
		expect(parsed).instanceOf(Person);
		expect(Object.getOwnPropertyDescriptor(parsed,"^").enumerable).equal(false);
	});
	it("Custom Created  - (JSON.stringify)", async function() {
		const created = new Created({name:"joe"}),
			references = {},
			hiddenProperties = ["^"],
			idProperty = "#",
			stringified = JSON.stringify(created,replacer),
			{kind,data} = JSON.parse(JSON.parse(stringified)),
			parsed = await JSON.parse(stringified,reviver);
		expect(kind).equal("Created");
		expect(parsed["#"]).equal(created["#"]);
		expect(parsed["^"].createdAt.getTime()).equal(created["^"].createdAt.getTime());
		expect(parsed).instanceOf(Created);
		expect(Object.getOwnPropertyDescriptor(parsed,"^").enumerable).equal(false);
	});
	it("function - encode/decode", async function() {
		const {kind,data} = codex.encode(Person,{functions:true}),
			decoded = await codex.decode({kind,data},{functions:true});
		expect(kind).equal("function");
		expect(data).equal(Person+"");
		expect(decoded+"").equal(Person+"");
	});
	it("function  - (JSON.stringify)", async function() {
		function Person(config={}) {
			Object.assign(this,config);
			Object.defineProperty(this,"^",{value:Object.assign({},config["^"])});
			if(!this["#"]) {
				this["#"] = `Person@${Math.random()}`; // good enough for demo
			}
			if(!this["^"].createdAt) {
				this["^"].createdAt = new Date();
			}
		};
		const stringified = JSON.stringify(Person,replacer),
			{kind,data} = JSON.parse(JSON.parse(stringified)),
			parsed = await JSON.parse(stringified,reviver);
		expect(kind).equal("function");
		expect(data).equal(Person+"");
		expect(typeof(parsed)).equal("function");
		expect(parsed+"").equal(Person+"");
	});
});