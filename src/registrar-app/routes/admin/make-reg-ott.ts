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

import { RequestHandler } from 'express';
import { MakeRegistrationOTT } from '../../resources/registrar';
import { makeOneTimeRegistrationToken as api } from '../../../regitrar-app-client/api/registrar-admin';

export function makeRegistrationOTT(
	makeRegOTTFunc: MakeRegistrationOTT
): RequestHandler {
	return async (req, res, next) => {
		try {

			const registration_ott = await makeRegOTTFunc();
			const reply: api.Reply = {
				registration_ott
			};
			res.status(api.SC.ok).json(reply);

		} catch (err) {
			next(err);
		}
	};
}


Object.freeze(exports);