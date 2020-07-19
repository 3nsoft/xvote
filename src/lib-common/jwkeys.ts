/*
 Copyright (C) 2015, 2020 3NSoft Inc.
 
 This program is free software: you can redistribute it and/or modify it under
 the terms of the GNU General Public License as published by the Free Software
 Foundation, either version 3 of the License, or (at your option) any later
 version.
 
 This program is distributed in the hope that it will be useful, but
 WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 See the GNU General Public License for more details.
 
 You should have received a copy of the GNU General Public License along with
 this program. If not, see <http://www.gnu.org/licenses/>. */

/**
 * This module defines json form of keys and signed objects.
 */

import { base64 } from "./buffer-utils";

export interface JsonKeyShort {
	/**
	 * This is a base64 representation of key's bytes.
	 */
	k: string;
	/**
	 * This is key's id.
	 */
	kid: string;
}

export interface JsonKey<U extends string> extends JsonKeyShort {
	/**
	 * This field is indicates application's use of this key, for example,
	 * "private-mail-key". Notice that it has noting to do with crypto 
	 * primitives, and everything to do with how key should be used by
	 *  applications, that should check this field, so as to guard against
	 *  miss-use of key material. Such strictness makes key reuse (bad security
	 *  design) difficult. 
	 */
	use: U;
	/**
	 * This field indicates which crypto-box high level function should be used
	 * with this key, for example, "NaCl-xsp-box". Notice that, unlike initial
	 * JWK standard, alg is not for naming crypto primitive, because you,
	 * developer, should use complete functionality, like that provided by NaCl,
	 * and you should not be dealing with crypto primitives. Crypto primitives
	 * are for libs, that should be written by cryptographers. If cryptographer
	 * gives you only primitives, it is the same as car dealer giving you parts
	 * for the car instead of an actual car. Your would call dealer's bullshit,
	 * and you must call cryptographer's one as well. They, cryptographer, in a
	 * 2nd decade of the 21st centure have no excuse to give us, developers,
	 * incomplete libs with mere crypto primitives, which hurt, when assembled
	 * incorrectly.
	 */
	alg: string;
}

export function isLikeJsonKey(jkey: JsonKey<any>): boolean {
	return (('object' === typeof jkey) && !!jkey &&
		('string' === typeof jkey.alg) && !!jkey.alg &&
		('string' === typeof jkey.kid) && !!jkey.kid &&
		('string' === typeof jkey.k) && !!jkey.k &&
		('string' === typeof jkey.kid && !!jkey.kid));
}

export interface Key<U extends string> {
	/**
	 * This is key's bytes.
	 */
	k: Uint8Array;
	/**
	 * This is key's id.
	 */
	kid: string;
	/**
	 * This field is indicates application's use of this key, for example,
	 * "private-mail-key". Notice that it has noting to do with crypto 
	 * primitives, and everything to do with how key should be used by
	 *  applications, that should check this field, so as to guard against
	 *  miss-use of key material. Such strictness makes key reuse (bad security
	 *  design) difficult. 
	 */
	use: U;
	/**
	 * This field indicates which crypto-box high level function should be used
	 * with this key, for example, "NaCl-xsp-box". Notice that, unlike initial
	 * JWK standard, alg is not for naming crypto primitive, because you,
	 * developer, should use complete functionality, like that provided by NaCl,
	 * and you should not be dealing with crypto primitives. Crypto primitives
	 * are for libs, that should be written by cryptographers. If cryptographer
	 * gives you only primitives, it is the same as car dealer giving you parts
	 * for the car instead of an actual car. Your would call dealer's bullshit,
	 * and you must call cryptographer's one as well. They, cryptographer, in a
	 * 2nd decade of the 21st centure have no excuse to give us, developers,
	 * incomplete libs with mere crypto primitives, which hurt, when assembled
	 * incorrectly.
	 */
	alg: string;
}

export interface SignedLoad {
	/**
	 * This is an id of a key that did the signature.
	 */
	alg: string;
	/**
	 * This is a function, used to make signature.
	 */
	kid: string;
	/**
	 * This is signature bytes, packed into base64 string.
	 */
	sig: string;
	/**
	 * This is bytes (packed into base64 string), on which signature was done.
	 */
	load: string;
}

export function isLikeSignedLoad(load: SignedLoad): boolean {
	return (('object' === typeof load) && !!load &&
			('string' === typeof load.alg) && !!load.alg &&
			('string' === typeof load.kid) && !!load.kid &&
			('string' === typeof load.sig) && !!load.sig &&
			('string' === typeof load.load && !!load.load));
}

export function keyFromJson<U extends string>(
	key: JsonKey<U>, use: U, alg: string, klen: number
): Key<U> {
	if (key.use === use) {
		if (key.alg === alg) {
			const bytes = base64.open(key.k);
			if (bytes.length !== klen) { throw new Error(
					"Key "+key.kid+" has a wrong number of bytes"); }
			return {
				use: key.use,
				alg: key.alg,
				kid: key.kid,
				k: bytes
			};
		} else {
			throw new Error("Key "+key.kid+
					", should be used with unsupported algorithm '"+
					key.alg+"'");
		}
	} else {
		throw new Error("Key "+key.kid+" has incorrect use '"+key.use+
				"', instead of '"+use+"'");
	}
}

export function keyToJson<U extends string>(key: Key<U>): JsonKey<U> {
	return {
		use: key.use,
		alg: key.alg,
		kid: key.kid,
		k: base64.pack(key.k)
	}
}


Object.freeze(exports);