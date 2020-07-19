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

import { OTTokens, BallotTriplets } from "./inmemory-hacks";
import { RegistrarPublicKeyUse, generateRegistrarKeyPair, RegistrationCert, signBallotInfo, getSignKeyFrom } from "../../lib-voting/registrar";
import { JsonKey, SignedLoad } from "../../lib-common/jwkeys";
import { bytesSync as randomBytesSync } from "../../lib-common/random-node";
import { arrays } from 'ecma-nacl';
import { VoterInfo } from '../../regitrar-app-client/api/registration';

export type MakeRegistrationOTT = () => Promise<string>;

export type RegisterVoter =
	(regOTT: string, voterInfo: VoterInfo) => Promise<SignedLoad>;

export type GetBallot = (ballotNum: number) => Promise<SignedLoad|undefined>;

export type ListBallots = () => Promise<number[]>;

export interface RegistrarResources {
	makeRegistartionOTT: MakeRegistrationOTT;
	registrarKey: JsonKey<RegistrarPublicKeyUse>;
	registerVoter: RegisterVoter;
	getBallot: GetBallot;
	listBallots: ListBallots;
}

const OTTOKEN_TIMEOUT = 30*60*1000;
const OTTOKEN_LEN = 30;
const REGISTRAR_KID_LEN = 20;

export const SC = Object.freeze({
	NOT_AUTHORIZED: 'not-authorized'
});

// XXX Hackaton note:
// All data storage will be in memory for hackaton code, and it will be changed
// to postgres db and file storage, where needed. Cause all simple configs of
// data storages takes time that isn't available at hackaton.

export async function makeRegistrarResources(
	registrarName: string
): Promise<RegistrarResources> {
	const arrFactory = arrays.makeFactory();
	const keyPair = generateRegistrarKeyPair(
		REGISTRAR_KID_LEN, randomBytesSync, arrFactory);
	const signKey = getSignKeyFrom(keyPair);

	const otTokens = new OTTokens();

	const ballots = new BallotTriplets();

	const registrar: RegistrarResources = {

		registrarKey: keyPair.pkey,

		makeRegistartionOTT: async () => otTokens.generateNew(
			OTTOKEN_TIMEOUT, OTTOKEN_LEN),

		registerVoter: async (regOTT, voterInfo) => {
			const ok = otTokens.useForRegistration(regOTT);
			if (!ok) { throw SC.NOT_AUTHORIZED; }
			const ballot_num = ballots.nextBallotNum();
			const cert: RegistrationCert<any> = {
				ballot_num,
				entry_pkey: voterInfo.entry_key,
				voting_pkey: voterInfo.voting_key,
				voter_info: voterInfo.voter_info,
				registered_at: Math.floor(Date.now()/1000),
				registrar: registrarName
			};
			const { ballotTriplet, registrationCert } = signBallotInfo(
				cert, signKey, arrFactory);
			ballots.addTriplet(ballot_num, ballotTriplet);
			return registrationCert;
		},

		getBallot: async ballotNum => ballots.get(ballotNum),

		listBallots: async () => ballots.list(),

	};
	return registrar;
}


Object.freeze(exports);