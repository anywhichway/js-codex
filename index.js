function reduceArray(accum,item) { accum.push(item); return accum; }

function Codex() {
	if(!(this instanceof Codex)) {
		return new Codex();
	}
	const codex = this,
		creators = {},
		ctors = {},
		decoders = {
			Array: async (data,options) => data.reduce(async (accum,item) => { accum = await accum; accum.push(await codex.decode(item,options)); return accum; },[]),
			BigInt: (data) => BigInt(data),
			BigInt64Array: (data) => BigInt64Array.from(data),
			BigUInt64Array: (data) => BigUInt64Array.from(data),
			Date: (data) => new Date(parseInt(data)),
			Float32Array: (data) => Float32Array.from(data),
			Float64Array: (data) => Float64Array.from(data),
			GeolocationCoordinates: (data) => codex.decode(data),
			GeolocationPosition: (data) => codex.decode(data),
			"-Infinity": () => -Infinity,
			Infinity: () => Infinity,
			Int8Array: (data) => Int8Array.from(data),
			Int16Array: (data) => Int16Array.from(data),
			Int32Array: (data) => Int32Array.from(data),
			NaN: () => NaN,
			Map: async (data,options) => (await codex.decode(data,options)).reduce((accum,[key,value]) => accum.set(key,value),new Map()),
			Object: (data,options) => Object.keys(data).reduce(async (accum,key) => { accum = await accum; accum[key] = await codex.decode(data[key],options); return accum; },{}),
			Set: async (data,options) => (await codex.decode(data,options)).reduce((accum,value) => accum.add(value),new Set()),
			Uint8Array: (data) => Uint8Array.from(data),
			Uint8ClampedArray: (data) => Uint8ClampedArray.from(data),
			Uint16Array: (data) => Uint16Array.from(data),
			Uint32Array: (data) => Uint16Array.from(data),
			undefined: () => undefined,
		},
		encode = (object,options) => {
			const hidden = {};
			options.hiddenProperties.forEach((property) => {
				const value = object[property];
				if(value!==undefined) {
					hidden[property] = codex.encode(value,options);
				}
			});
			return [`${object.constructor.name}@`,codex.encode(Object.assign({},object,hidden),options)]
		},
		encoders = {
				Array: (data,options) => data.map((item) => codex.encode(item,options)),
				boolean: (data) => data,
				bigint: (data) => `BigInt@${data}`,
				BigInt: (data) => `BigInt@${data}`,
				BigInt64Array: (data) => ["BigInt64Array@",data.reduce((accum,item) => { accum.push(`${item}`); return accum; },[])],
				BigUInt64Array: (data) => ["BigUInt64Array@",data.reduce((accum,item) => { accum.push(`${item}`); return accum; },[])],
				Date: (data) => `Date@${data.getTime()}`,
				Float32Array: (data) => ["Float32Array@",data.reduce(reduceArray,[])],
				Float64Array: (data) => ["Float64Array@",data.reduce(reduceArray,[])],
				GeolocationCoordinates: (data) => ["GeolocationCoordinates@",codex.encode({latitude:data.latitude,longitude:data.longitude,altitude:data.alitude,accuracy:data.accuracy,altitudeAccuracy:data.altitudeAccuracy,heading:data.heading,speed:data.speed})],
				GeolocationPosition: (data) => ["GeolocationPosition@",codex.encode({coords:data.coords,timestamp:data.timestamp})],
				"-Infinity": () => "-Infinity@",
				Infinity: () => "Infinity@",
				Int8Array: (data) => ["Int8Array@",data.reduce(reduceArray,[])],
				Int16Array: (data) => ["Int16Array@",data.reduce(reduceArray,[])],
				Int32Array: (data) => ["Int32Array@",data.reduce(reduceArray,[])],
				Map: (data,options) => ["Map@",codex.encode(Array.from(data),options)],
				NaN: () => "NaN@",
				number: (data) => data,
				Object: (data,options) => Object.keys(data).reduce((accum,key) => { accum[key] = codex.encode(data[key],options); return accum; },{}),
				Set: (data,options) => ["Set@",codex.encode(Array.from(data),options)],
				string: (data) => data,
				Uint8Array: (data) => ["Uint8Array@",data.reduce(reduceArray,[])],
				Uint8ClampedArray: (data) => ["Uint8ClampedArray@",data.reduce(reduceArray,[])],
				Uint16Array: (data) => ["Uint16Array@",data.reduce(reduceArray,[])],
				undefined: () => "undefined@",
			};
	
	Object.defineProperty(this,"decode",{configurable:true,writable:true,value:async (data,{isReference=(id) => typeof(id)==="string" && id.split("@").length===2 && ctors[id.split("@")[0]],references}={}) => {
		const type = typeof(data);
		let key, value;
		if(type==="string") {
			if(isReference(data)) {
				const type = typeof(references)
				if(type==="function") {
					return references(data);
				}
				if(references && type==="object" && references[data]) {
					return references[data];
				}
			}
			if(data.includes("@")) {
				[key,...value] = data.split("@");
				if(value.length!==1 || !decoders[key]) {
					return;
				}
			}
		} else if(Array.isArray(data)) {
			[key,...value] = data;
			if(typeof(key)==="string" && key.includes("@")) {
				[key] = key.split("@");
			} else {
				return data.reduce(async (accum,item) => { accum = await accum; accum.push(await codex.decode(item,{isReference,references})); return accum;},[])
			}
		} else if(data && type==="object") {
			key = data.constructor.name;
			value = data;
		}
		if(key) {
			const decoder = decoders[key]||(data && type==="object" ? (data.decode ? data.decode.bind(data) : (data.constructor.decode ? data.constructor.decode.bind(data.constructor) : null)) : null);
			if(decoder) {
				return decoder(Array.isArray(value) ? value[0] : value,{isReference,references});
			}
			const create = creators[key];
			if(create) {
				value = Object.keys(data).reduce(async (accum,key) => { accum = await accum; accum[key] = await codex.decode(data[key],{isReference,references}); return accum; },Array.isArray(data) ? [] : {})
				return create(value);
			}
		}
		return data;
	}});

	Object.defineProperty(this,"encode",{configurable:true,writable:true,value:(data,{idProperty,hiddenProperties=[],references}={}) => {
		if(idProperty && !references) {
			throw new Error(`call of 'encode' was made with a idProperty="${idProperty}" but no references object`);
		}
		if(!idProperty && references) {
			throw new Error(`call of 'encode' was made with a references object but no idProperty`);
		}
		const type = typeof(data),
			key = ["boolean","number","string","bigint"].includes(type) ? type : (data && type==="object" ? data.constructor.name : data);
		let encoder = encoders[data]||encoders[key]||(data && type==="object" ? (data.encode ? data.encode.bind(data) : (data.constructor.encode ? data.constructor.encode.bind(data.constructor) : null)) : null);
		if(data && type==="object") {
			ctors[data.constructor.name] = data.constructor;
		}
		if(encoder) {
			data = encoder(data,{idProperty,hiddenProperties,references});
			if(data.encode || data.constructor.encode) {
				data = [`${data.constructor.name}@`,data];
			}
		} else if(data && type==="object") {
			// create default decoder and encoder
			const ctor = data.constructor,
				name = ctor.name,
				decode = (data,{isReference,references}) => {
					if(isReference(data)) {
						const type = typeof(references);
						if(type==="function") {
							return references(type);
						}
						if(data && type==="object") {
							return references[data];
						}
						return data;
					}
					if(ctor.create) {
						return ctor.create(data);
					}
					return Object.assign(Object.create(ctor.prototype),data);
				};
			codex.register({ctor,encode,decode});
			data = encode(data,{idProperty,hiddenProperties,references});
		}
		if(data && type==="object") {
			let ref = data;
			if(Array.isArray(data) && data.length===2 && typeof(data[0])==="string" && data[0].endsWith("@")) {  // data = [<className>@>,<data>]
				ref = data[1];
			}
			if(hiddenProperties.length>0) {
				const hidden = hiddenProperties.reduce((accum,property) => {
					const value = ref[property];
					if(value!==undefined) {
						accum[property] = codex.encode(value,{idProperty,hiddenProperties,references});
					}
					return accum;
				},{});
				ref = Object.assign({},ref,hidden);
			}
			if(idProperty && ref[idProperty]) {
				// establish reference and return just id
				const id = ref[idProperty];
				references[id] = ref;
				return id;
			}
		}
		return data;
	}});
	
	Object.defineProperty(this,"register",{configurable:true,writable:true,value:({ctor,name=ctor.name,encode,decode,create}) => {
		ctors[name] = ctor;
		encoders[name] = encode;
		decoders[name] = decode;
		creators[name] = create;
	}});
}

export default Codex;
export {Codex};