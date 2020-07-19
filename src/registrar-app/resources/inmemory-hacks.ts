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

import { stringOfB64Chars } from '../../lib-common/random-node';

// XXX Hackaton note:
// All data storage will be in memory for hackaton code, and it will be changed
// to postgres db and file storage, where needed. Cause all simple configs of
// data storages takes time that isn't available at hackaton.

export class OTTokens {

	private readonly unusedTokens = new Map<string, number>();

	async generateNew(timeout: number, tLen: number): Promise<string> {
		const now = Date.now();
		const goodTill = now + timeout;
		let token: string;
		do {
			token = await stringOfB64Chars(tLen);
		} while (this.unusedTokens.has(token));
		this.unusedTokens.set(token, goodTill);
		return token;
	}

}
Object.freeze(OTTokens.prototype);
Object.freeze(OTTokens);


Object.freeze(exports);