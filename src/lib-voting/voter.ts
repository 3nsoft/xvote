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

import { GetRandom, box, arrays } from "ecma-nacl";
import { JsonKey, SignedLoad, keyFromJson } from '../lib-common/jwkeys';
import { generateEncryptingKeyPair, verifySignatureAndOpen } from "./key-utils";
import { RegistrarPublicKeyUse } from "./registrar";
import { MainVotingPublicKeyUse, MainVotingSecretKeyUse } from "./ballot-box";
import { utf8 } from "../lib-common/buffer-utils";

export type VotingPublicKeyUse = 'voting-public-key';
export type VotingSecretKeyUse = 'voting-secret-key';

export interface VotingKeyPairJSON {
	pkey: JsonKey<VotingPublicKeyUse>;
	skey: JsonKey<VotingSecretKeyUse>;
}

export function generateVotingKeyPair(
	kidLen: number, random: GetRandom, arrFactory?: arrays.Factory
): VotingKeyPairJSON {
	return generateEncryptingKeyPair(
		'voting-public-key', 'voting-secret-key',
		kidLen, random, arrFactory);
}

export type EntryPublicKeyUse = 'entry-public-key';
export type EntrySecretKeyUse = 'entry-secret-key';

export interface EntryKeyPairJSON {
	pkey: JsonKey<EntryPublicKeyUse>;
	skey: JsonKey<EntrySecretKeyUse>;
}

export function generateEntryKeyPair(
	kidLen: number, random: GetRandom, arrFactory?: arrays.Factory
): EntryKeyPairJSON {
	return generateEncryptingKeyPair(
		'entry-public-key', 'entry-secret-key',
		kidLen, random, arrFactory);
}

export function verifyRegistrarSignatureAndOpen<T>(
	load: SignedLoad, regKey: JsonKey<RegistrarPublicKeyUse>,
	arrFactory?: arrays.Factory
): T {
	return verifySignatureAndOpen(
		load, regKey, 'registrar-public-key', arrFactory);
}

function bigendianFourByteInt(x: number): Uint8Array {
	if (x > 0xffffffff) { throw new Error(
		`Number ${x} is bigger than expected unsigned 32 bit integer`); }
	const arr = new Uint8Array(4);
	arr[3] = x;
	arr[2] = x >>> 8;
	arr[1] = x >>> 16;
	arr[0] = x >>> 24;
	return arr;
}

export function encryptVote<V extends object>(
	ballot_num: number, vote: V, voterKey: JsonKey<VotingSecretKeyUse>,
	mainKey: JsonKey<MainVotingPublicKeyUse>, random: GetRandom,
	arrFactory?: arrays.Factory
): Uint8Array {
	const voteBytes = utf8.pack(JSON.stringify(vote));
	const skey = keyFromJson(
		voterKey, 'voting-secret-key', box.JWK_ALG_NAME, box.KEY_LENGTH);
	const pkey = keyFromJson(
		mainKey, 'main-voting-public-key', box.JWK_ALG_NAME, box.KEY_LENGTH);
	const nonce = random(box.NONCE_LENGTH);
	const ballotNumBytes = bigendianFourByteInt(ballot_num);
	nonce.set(ballotNumBytes, 0);
	return box.formatWN.pack(voteBytes, nonce, pkey.k, skey.k, arrFactory);
}

export function decryptVote<V extends object>(
	ballot_num: number, voteWNCipher: Uint8Array,
	voterKey: JsonKey<VotingPublicKeyUse>,
	mainKey: JsonKey<MainVotingSecretKeyUse>, arrFactory?: arrays.Factory
): V {
	const ballotNumBytes = bigendianFourByteInt(ballot_num);
	for (let i=0; i<ballotNumBytes.length; i+=1) {
		if (voteWNCipher[i] !== ballotNumBytes[i]) { throw new Error(
			`Nonce in vote cipher doesn't match ballot number.`); }
	}
	const skey = keyFromJson(
		mainKey, 'main-voting-secret-key', box.JWK_ALG_NAME, box.KEY_LENGTH);
	const pkey = keyFromJson(
		voterKey, 'voting-public-key', box.JWK_ALG_NAME, box.KEY_LENGTH);
	const voteBytes = box.formatWN.open(
		voteWNCipher, pkey.k, skey.k, arrFactory);
	try {
		return JSON.parse(utf8.open(voteBytes));
	} catch (err) {
		throw new Error(`Can't open vote from decrypted bytes:\n${err.stack}`);
	}
}

Object.freeze(exports);