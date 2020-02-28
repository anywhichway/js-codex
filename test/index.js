var chai,
	expect,
	nanomemoize,
	Codex;
if(typeof(window)==="undefined") {
	chai = require("chai");
	expect = chai.expect;
	Codex = require("../index.js").Codex; // does not currentl work, must test from browser
} else {
	Codex = window.Codex;
}

describe("Test",function() {
	let codex;
	before(() => {
		codex = new Codex();
	});
	it("boolean - false", async function() {
		const {kind,data} = codex.encode(false),
			decoded = await codex.decode({kind,data});
		expect(kind).equal("boolean");
		expect(data).equal(false);
		expect(decoded).equal(false);
	});
	it("boolean - true", async function() {
		const {kind,data} = codex.encode(true),
		decoded = await codex.decode({kind,data});
		expect(kind).equal("boolean");
		expect(data).equal(true);
		expect(decoded).equal(true);
	});
	it("number", async function() {
		const {kind,data} = codex.encode(1),
			decoded = await codex.decode({kind,data});
		expect(kind).equal("number");
		expect(data).equal(1);
		expect(decoded).equal(1);
	});
	it("string", async function() {
		const {kind,data}  = codex.encode("a string"),
			decoded = await codex.decode({kind,data} );
		expect(kind).equal("string");
		expect(data).equal("a string");
		expect(decoded).equal("a string");
	});
	it("undefined", async function() {
		const {kind,data} = codex.encode(),
			decoded = await codex.decode({kind,data});
		expect(kind).equal("undefined");
		expect(data).equal(undefined);
		expect(decoded).equal(undefined);
	});
	it("bigint", async function() {
		const {kind,data}  = codex.encode(9007199254740991n),
			decoded = await codex.decode({kind,data} );
		expect(kind).equal("bigint");
		expect(data).equal(9007199254740991n);
		expect(decoded).equal(9007199254740991n);
	});
	it("Infinity", async function() {
		const {kind,data}  = codex.encode(Infinity),
			decoded = await codex.decode({kind,data});
		expect(kind).equal("Infinity");
		expect(data).equal(undefined);
		expect(decoded).equal(Infinity);
	});
	it("-Infinity", async function() {
		const {kind,data} = codex.encode(-Infinity),
			decoded = await codex.decode({kind,data});
		expect(kind).equal("-Infinity");
		expect(data).equal(undefined);
		expect(decoded).equal(-Infinity);
	});
	it("NaN", async function() {
		const {kind,data} = codex.encode(NaN),
			decoded = await codex.decode({kind,data});
		expect(kind).equal("NaN");
		expect(data).equal(undefined);
		expect(decoded+"").equal("NaN");
	});
	it("Date", async function() {
		const now = new Date(),
			{kind,data}  = codex.encode(now),
			decoded = await codex.decode({kind,data} );
		expect(kind).equal("Date");
		expect(data).equal(now.getTime());
		expect(decoded.getTime()).equal(now.getTime());
	});
	[Int8Array,Uint8Array,Uint8ClampedArray,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array].forEach((array) => {
		it(array.name, async function() {
			const base = [1,2,3],
				{kind,data}  = codex.encode(array.from(base)),
				decoded = await codex.decode({kind,data} );
			expect(kind).equal(array.name);
			expect(Array.isArray(data)).equal(true);
			expect(data.length).equal(3);
			expect(data.every((item,i) => base[i]===item)).equal(true);
			expect(base.every((item,i) => decoded[i]===item)).equal(true);
		});
	});
	[BigInt64Array,BigUint64Array].forEach((array) => {
		it(array.name, async function() {
			const base = [1n,2n,3n],
				{kind,data} = codex.encode(array.from(base)),
				decoded = await codex.decode({kind,data}  );
			expect(kind).equal(array.name);
			expect(Array.isArray(data)).equal(true);
			expect(data.length).equal(3);
			expect(data.every((item,i) => base[i]+""===item)).equal(true);
			expect(base.every((item,i) => decoded[i]===item)).equal(true);
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
	it("URL", async function() {
		const url = new URL(window.location.href),
			{kind,data}  = codex.encode(url),
			decoded = await codex.decode({kind,data} );
		expect(kind).equal("URL");
		expect(data).equal(window.location.href);
		expect(decoded.href).equal(window.location.href);
	});
	it("Custom Object", async function() {
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
});