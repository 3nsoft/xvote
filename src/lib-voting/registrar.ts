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

import { GetRandom, arrays, signing } from "ecma-nacl";
import { JsonKey, Key, keyFromJson, SignedLoad } from '../lib-common/jwkeys';
import { generateSigningKeyPair, sign } from "./key-utils";
import { VotingPublicKeyUse, EntryPublicKeyUse } from "./voter";

export type RegistrarPublicKeyUse = 'registrar-public-key';
export type RegistrarSecretKeyUse = 'registrar-secret-key';

export interface RegistrarKeyPairJSON {
	pkey: JsonKey<RegistrarPublicKeyUse>;
	skey: JsonKey<RegistrarSecretKeyUse>;
}

export function generateRegistrarKeyPair(
	kidLen: number, random: GetRandom, arrFactory?: arrays.Factory
): RegistrarKeyPairJSON {
	return generateSigningKeyPair(
		'registrar-public-key', 'registrar-secret-key',
		kidLen, random, arrFactory);
}

export function getSignKeyFrom(
	pair: RegistrarKeyPairJSON
): Key<RegistrarSecretKeyUse> {
	return keyFromJson(
		pair.skey, 'registrar-secret-key',
		signing.JWK_ALG_NAME,
		signing.SECRET_KEY_LENGTH);
}

export interface BallotTriplet {
	ballot_num: number;
	entry_pkey: JsonKey<EntryPublicKeyUse>;
	voting_pkey: JsonKey<VotingPublicKeyUse>;
}

export interface RegistrationCert<I extends object> extends BallotTriplet {
	voter_info: I;
	registrar: string;
	registered_at: number;
}

export function signBallotInfo<I extends object>(
	cert: RegistrationCert<I>, signKey: Key<RegistrarSecretKeyUse>,
	arrFactory?: arrays.Factory
): { registrationCert: SignedLoad; ballotTriplet: SignedLoad; } {
	const registrationCert = sign(cert, signKey, arrFactory);
	const triplet: BallotTriplet = {
		ballot_num: cert.ballot_num,
		entry_pkey: cert.entry_pkey,
		voting_pkey: cert.voting_pkey
	};
	const ballotTriplet = sign(triplet, signKey, arrFactory);
	return { ballotTriplet, registrationCert };
}

Object.freeze(exports);