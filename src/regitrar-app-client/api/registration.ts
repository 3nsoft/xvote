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

import { RegistrarPublicKeyUse } from "../../lib-voting/registrar";
import { JsonKey, SignedLoad } from "../../lib-common/jwkeys";
import { VotingPublicKeyUse, EntryPublicKeyUse } from "../../lib-voting/voter";

export const REG_OTT_HEADER = 'X-Registration-OTT';

export namespace registrarKey {

	export const URL_END = '/registrar-key';

	export const method = 'GET';

	export type Reply = JsonKey<RegistrarPublicKeyUse>;

	export const SC = Object.freeze({
		ok: 200,
	});

}
Object.freeze(registrarKey);

export interface VoterInfo {
	entry_key: JsonKey<EntryPublicKeyUse>;
	voting_key: JsonKey<VotingPublicKeyUse>;
	voter_info: any;
}

export namespace registerVoter {

	export const URL_END = '/register';

	export const method = 'PUT';

	export type Request = VoterInfo;

	export type Reply = SignedLoad;

	export const SC = Object.freeze({
		ok: 200,
		notAllowed: 403
	});

}
Object.freeze(registerVoter);

export namespace listBallots {

	export const URL_END = '/ballots';

	export const method = 'GET';

	export type Reply = number[];

	export const SC = Object.freeze({
		ok: 200,
	});

}
Object.freeze(listBallots);

export namespace getBallot {

	export const URL_END = '/ballot/:ballotNum';

	export const method = 'GET';

	export type Reply = SignedLoad;

	export const SC = Object.freeze({
		ok: 200,
		notFound: 404
	});

}
Object.freeze(getBallot);


Object.freeze(exports);