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
		const encoded = codex.encode(false),
			decoded = await codex.decode(encoded);
		expect(encoded).equal(false);
		expect(decoded).equal(false);
	});
	it("boolean - true", async function() {
		const encoded = codex.encode(true),
			decoded = await codex.decode(encoded);
		expect(encoded).equal(true);
		expect(decoded).equal(true);
	});
	it("number", async function() {
		const encoded = codex.encode(1),
			decoded = await codex.decode(encoded);
		expect(encoded).equal(1);
		expect(decoded).equal(1);
	});
	it("string", async function() {
		const encoded = codex.encode("a string"),
			decoded = await codex.decode(encoded);
		expect(encoded).equal("a string");
		expect(decoded).equal("a string");
	});
	it("undefined", async function() {
		const encoded = codex.encode(),
			decoded = await codex.decode(encoded);
		expect(encoded).equal("undefined@");
		expect(decoded).equal(undefined);
	});
	it("Infinity", async function() {
		const encoded = codex.encode(Infinity),
			decoded = await codex.decode(encoded);
		expect(encoded).equal("Infinity@");
		expect(decoded).equal(Infinity);
	});
	it("-Infinity", async function() {
		const encoded = codex.encode(-Infinity),
			decoded = await codex.decode(encoded);
		expect(encoded).equal("-Infinity@");
		expect(decoded).equal(-Infinity);
	});
	it("NaN", async function() {
		const encoded = codex.encode(NaN),
			decoded = await codex.decode(encoded);
		expect(encoded).equal("NaN@");
		expect(decoded+"").equal("NaN");
	});
	it("Date", async function() {
		const now = new Date(),
			encoded = codex.encode(now),
			decoded = await codex.decode(encoded);
		expect(encoded.startsWith("Date@")).equal(true);
		expect(decoded.getTime()).equal(now.getTime());
	});
	it("BigInt", async function() {
		const encoded = codex.encode(9007199254740991n),
			decoded = await codex.decode(encoded);
		expect(encoded).equal("BigInt@9007199254740991");
		expect(decoded).equal(9007199254740991n);
	});
	[Int8Array,Uint8Array,Uint8ClampedArray,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array].forEach((array) => {
		it(array.name, async function() {
			const base = [1,2,3],
				encoded = codex.encode(array.from(base)),
				decoded = await codex.decode(encoded);
			expect(Array.isArray(encoded)).equal(true);
			expect(encoded[1].length).equal(3);
			expect(encoded[1].every((item,i) => base[i]===item)).equal(true);
			expect(base.every((item,i) => decoded[i]===item)).equal(true);
		});
	});
	[BigInt64Array,BigUint64Array].forEach((array) => {
		it(array.name, async function() {
			const base = [1n,2n,3n],
				encoded = codex.encode(array.from(base)),
				decoded = await codex.decode(encoded);
			expect(Array.isArray(encoded)).equal(true);
			expect(encoded[1].length).equal(3);
			expect(encoded[1].every((item,i) => base[i]+""===item)).equal(true);
			expect(base.every((item,i) => decoded[i]===item)).equal(true);
		});
	});
});