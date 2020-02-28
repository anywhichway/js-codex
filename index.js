function reduceArray(accum,item) { accum.push(item); return accum; }

function Codex() {
	if(!(this instanceof Codex)) {
		return new Codex();
	}
	const codex = this,
		creators = {},
		ctors = {},
		_isReference = (id) => typeof(id)==="string" && id.split("@").length===2 && ctors[id.split("@")[0]],
		decoders = {
			Array: async (data,options) => data.reduce(async (accum,item) => { accum = await accum; accum.push(await codex.decode(item,options)); return accum; },[]),
			Boolean: (data) => new Boolean(data),
			BigInt: (data) => BigInt(data),
			BigInt64Array: (data) => BigInt64Array.from(data),
			BigUint64Array: (data) => BigUint64Array.from(data),
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
			Map: async (data,options) => (await codex.decode({kind:"Array",data},options)).reduce((accum,[key,value]) => accum.set(key,value),new Map()),
			Number: (data) => new Number(data),
			Object: (data,options) => Object.keys(data).reduce(async (accum,key) => { accum = await accum; accum[key] = await codex.decode(data[key],options); return accum; },{}),
			Set: async (data,options) => (await codex.decode({kind:"Array",data},options)).reduce((accum,value) => accum.add(value),new Set()),
			String: (data) => new String(data),
			Uint8Array: (data) => Uint8Array.from(data),
			Uint8ClampedArray: (data) => Uint8ClampedArray.from(data),
			Uint16Array: (data) => Uint16Array.from(data),
			Uint32Array: (data) => Uint16Array.from(data),
			URL: (data) => new URL(data),
			bigint: (data) => data,
			boolean: (data) => data,
			number: (data) => data,
			string: (data) => data,
			undefined: () => undefined
		},
		decodeObject = async ({kind,data},options) => {
			const {isReference=_isReference,idProperty,hiddenProperties=[],references} = options,
				ctor = ctors[kind],
				name = ctor.name;
			let decoded = {};
			for(const key of hiddenProperties) {
				decoded[key] = await codex.decode(data[key],options)
			}
			for(const key in data) {
				if(decoded[key]===undefined) {
					decoded[key] = await codex.decode(data[key],options);
				}
			}
			const create = creators[kind]||(ctor ? ctor.create : null);
			if(create) {
				decoded = ctor.create(decoded);
			} else if(ctor) {
				decoded = Object.assign(Object.create(ctor.prototype),decoded);
				hiddenProperties.forEach((key) => {
					const desc = Object.getOwnPropertyDescriptor(decoded,key);
					desc.enumerable = false;
					Object.defineProperty(decoded,key,desc);
				});
			}
			return decoded;
		},
		encodeObject = (object,options) => {
			const {isReference=_isReference,idProperty,hiddenProperties=[],references} = options,
				data = {};
			hiddenProperties.forEach((key) => data[key] = codex.encode(object[key],options));
			options = Object.assign({},options);
			delete options.hiddenProperties;
			for(const key in object) {
				if(data[key]===undefined) {
					data[key] = codex.encode(object[key],options);
				}
			}
			const id = object[idProperty];
			if(id) {
				if(references[id]) {
					return {kind:object.constructor.name,data:id}
				}
				references[id] = data;
			}
			return {kind:object.constructor.name,data}
		},
		encoders = {
				Array: (data,options) => data.map((item) => codex.encode(item,options)),
				boolean: (data) => data,
				bigint: (data) => data,
				BigInt64Array: (data) => data.reduce((accum,item) => { accum.push(`${item}`); return accum; },[]),
				BigUint64Array: (data) => data.reduce((accum,item) => { accum.push(`${item}`); return accum; },[]),
				Date: (data) => data.getTime(),
				Float32Array: (data) => data.reduce(reduceArray,[]),
				Float64Array: (data) => data.reduce(reduceArray,[]),
				GeolocationCoordinates: (data) => codex.encode({latitude:data.latitude,longitude:data.longitude,altitude:data.alitude,accuracy:data.accuracy,altitudeAccuracy:data.altitudeAccuracy,heading:data.heading,speed:data.speed}),
				GeolocationPosition: (data) => codex.encode({coords:data.coords,timestamp:data.timestamp}),
				"-Infinity": () => undefined,
				Infinity: () => undefined,
				Int8Array: (data) => data.reduce(reduceArray,[]),
				Int16Array: (data) => data.reduce(reduceArray,[]),
				Int32Array: (data) => data.reduce(reduceArray,[]),
				Map: (data,options) => codex.encode(Array.from(data),options).data,
				NaN: () => undefined,
				number: (data) => data,
				Object: (data,options) => Object.keys(data).reduce((accum,key) => { accum[key] = codex.encode(data[key],options); return accum; },{}),
				Set: (data,options) => codex.encode(Array.from(data),options).data,
				string: (data) => data,
				Uint8Array: (data) => data.reduce(reduceArray,[]),
				Uint8ClampedArray: (data) => data.reduce(reduceArray,[]),
				Uint16Array: (data) => data.reduce(reduceArray,[]),
				Uint32Array: (data) => data.reduce(reduceArray,[]),
				URL: (data) => data.href,
				undefined: () => undefined
			};
	Object.defineProperty(this,"decode",{configurable:true,writable:true,value:async ({kind,data},{isReference=_isReference,idProperty,hiddenProperties=[],references}={}) => {
		const type = typeof(data),
			reference = isReference(data),
			referencestype = typeof(references),
			ctor = ctors[kind];
		let decoded;
		if(reference) {
			if(referencestype==="function") {
				return references(data);
			}
			if(references && referencestype==="object" && references[data]) {
				decoded = references[data];
				if(ctor && decoded && typeof(decoded)==="object" && decoded instanceof ctor) {
					return decoded;
				}
			}
		}
		const decoder = decoders[kind]||(data && type==="object" ? (data.decode ? data.decode.bind(data) : (data.constructor.decode ? data.constructor.decode.bind(data.constructor) : null)) : null);
		if(decoder) {
			decoded = await decoder(data,{isReference,hiddenProperties,references});
		} else {
			if(data && type==="object") {
				decoded = Object.keys(data).reduce(async (accum,key) => { accum = await accum; accum[key] = await codex.decode(data[key],{isReference,hiddenProperties,references}); return accum; },Array.isArray(data) ? [] : {})
			} else {
				decoded = data;
			}
			const create = creators[kind]||(ctor ? ctor.create : null);
			if(create) {
				decoded = create(decoded);
			}
		}
		if(references && referencestype==="object" && data && type==="object" && idProperty && data[idProperty]) {
			references[data[idProperty]] = decoded;
		}
		return decoded;
	}});

	Object.defineProperty(this,"encode",{configurable:true,writable:true,value:(data,{isReference=_isReference,idProperty,hiddenProperties=[],references}={}) => {
		if(idProperty && !references) {
			throw new Error(`call of 'encode' was made with a idProperty="${idProperty}" but no references object`);
		}
		if(!idProperty && references) {
			throw new Error(`call of 'encode' was made with a references object but no idProperty`);
		}
		const type = typeof(data),
			kind = encoders[data] ? data+"" : (data && type==="object" ? data.constructor.name : type);
		let encoded,
			encoder = encoders[kind]||(data && type==="object" ? (data.encode ? data.encode.bind(data) : (data.constructor.encode ? data.constructor.encode.bind(data.constructor) : null)) : null);
		if(encoder) {
			encoded = {kind,data:encoder(data,{idProperty,hiddenProperties,references})};
		} else if(data && type==="object") {
			// create default decoder and encoder
			const ctor = ctors[data.constructor.name] = data.constructor,
				name = ctor.name,
				decode = async (data) => decodeObject({kind:name,data},{isReference,idProperty,hiddenProperties,references});
			codex.register({ctor,encode:encodeObject,decode});
			encoded = encodeObject(data,{idProperty,hiddenProperties,references});
		}
		return encoded;
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