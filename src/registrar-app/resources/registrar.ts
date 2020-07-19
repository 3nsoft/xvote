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

import { OTTokens } from "./inmemory-hacks";
import { RegistrarPublicKeyUse, generateRegistrarKeyPair } from "../../lib-voting/registrar";
import { JsonKey } from "../../lib-common/jwkeys";
import { bytesSync as randomBytesSync } from "../../lib-common/random-node";
import { arrays } from 'ecma-nacl';

export type MakeRegistrationOTT = () => Promise<string>;

export interface RegistrarResources {
	makeRegistartionOTT: MakeRegistrationOTT;
	registrarKey: JsonKey<RegistrarPublicKeyUse>;
}

const OTTOKEN_TIMEOUT = 30*60*1000;
const OTTOKEN_LEN = 30;
const REGISTRAR_KID_LEN = 20;

// XXX Hackaton note:
// All data storage will be in memory for hackaton code, and it will be changed
// to postgres db and file storage, where needed. Cause all simple configs of
// data storages takes time that isn't available at hackaton.

export async function makeRegistrarResources(): Promise<RegistrarResources> {
	const arrFactory = arrays.makeFactory();
	const keyPair = generateRegistrarKeyPair(
		REGISTRAR_KID_LEN, randomBytesSync, arrFactory);
	const otTokens = new OTTokens();
	const registrar: RegistrarResources = {

		registrarKey: keyPair.pkey,

		makeRegistartionOTT: async () => otTokens.generateNew(
			OTTOKEN_TIMEOUT, OTTOKEN_LEN),

	};
	return registrar;
}


Object.freeze(exports);