/*
 Copyright (C) 2020 XMart.me.
 
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

import { signing, box, GetRandom, arrays } from "ecma-nacl";
import { JsonKey, Key, SignedLoad, keyFromJson } from '../lib-common/jwkeys';
import { base64, utf8 } from "../lib-common/buffer-utils";
import { assert } from "../lib-common/assert";

export interface KeyPairJSON<PubUse extends string, SecUse extends string> {
	pkey: JsonKey<PubUse>;
	skey: JsonKey<SecUse>;
}

export function generateSigningKeyPair<P extends string, S extends string>(
	pubUse: P, secUse: S,
	kidLen: number, random: GetRandom, arrFactory?: arrays.Factory
): KeyPairJSON<P, S> {
	const pair = signing.generate_keypair(random(32), arrFactory);
	const pkey: KeyPairJSON<P, S>['pkey'] = {
		use: pubUse,
		alg: signing.JWK_ALG_NAME,
		kid: base64.pack(random(kidLen)),
		k: base64.pack(pair.pkey)
	};
	const skey: KeyPairJSON<P, S>['skey'] = {
		use: secUse,
		alg: pkey.alg,
		kid: pkey.kid,
		k: base64.pack(pair.skey)
	}
	return { pkey, skey };
}

export function generateEncryptingKeyPair<P extends string, S extends string>(
	pubUse: P, secUse: S,
	kidLen: number, random: GetRandom, arrFactory?: arrays.Factory
): KeyPairJSON<P, S> {
	const sk = random(box.KEY_LENGTH);
	const pk = box.generate_pubkey(sk, arrFactory);
	const pkey: KeyPairJSON<P, S>['pkey'] = {
		use: pubUse,
		alg: signing.JWK_ALG_NAME,
		kid: base64.pack(random(kidLen)),
		k: base64.pack(pk)
	};
	const skey: KeyPairJSON<P, S>['skey'] = {
		use: secUse,
		alg: pkey.alg,
		kid: pkey.kid,
		k: base64.pack(sk)
	}
	return { pkey, skey };
}

export function sign<T, U extends string>(
	payload: T, signKey: Key<U>, arrFactory?: arrays.Factory
): SignedLoad {
	const certBytes = utf8.pack(JSON.stringify(payload));
	const sigBytes = signing.signature(certBytes, signKey.k, arrFactory);
	return {
		alg: signKey.alg,
		kid: signKey.kid,
		sig: base64.pack(sigBytes),
		load: base64.pack(certBytes)
	};
}

export function verifySignatureAndOpen<U extends string>(
	load: SignedLoad, signKey: JsonKey<U>, keyUse: U, arrFactory?: arrays.Factory
): any {
	const pkey = keyFromJson(
		signKey, keyUse, signing.JWK_ALG_NAME, signing.PUBLIC_KEY_LENGTH);
	assert((load.kid === pkey.kid) && (load.alg === pkey.alg));
	const sigBytes = base64.open(load.sig);
	const loadBytes = base64.open(load.load);
	if (signing.verify(sigBytes, loadBytes, pkey.k, arrFactory)) {
		try {
			return JSON.parse(utf8.open(loadBytes));
		} catch (err) {
			throw new Error(`Can't open signed load:\n${err.stack}`);
		}
	} else {
		throw new Error(`Signature verification failed`);
	}
}

Object.freeze(exports);