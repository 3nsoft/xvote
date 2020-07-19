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

import { GetRandom, arrays } from "ecma-nacl";
import { JsonKey } from '../lib-common/jwkeys';
import { generateEncryptingKeyPair } from "./key-utils";

export type MainVotingPublicKeyUse = 'main-voting-public-key';
export type MainVotingSecretKeyUse = 'main-voting-secret-key';

export interface MainVotingKeyPairJSON {
	pkey: JsonKey<MainVotingPublicKeyUse>;
	skey: JsonKey<MainVotingSecretKeyUse>;
}

export function generateVotingKeyPair(
	kidLen: number, random: GetRandom, arrFactory?: arrays.Factory
): MainVotingKeyPairJSON {
	return generateEncryptingKeyPair(
		'main-voting-public-key', 'main-voting-secret-key',
		kidLen, random, arrFactory);
}
