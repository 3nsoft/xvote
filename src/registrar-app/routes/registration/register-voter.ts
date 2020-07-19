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
import { registerVoter as api, REG_OTT_HEADER } from '../../../regitrar-app-client/api/registration';
import { RegisterVoter, SC } from '../../resources/registrar';

export function registerVoter(registerFunc: RegisterVoter): RequestHandler {
	return async (req, res, next) => {
		try {

			const regOTT = req.get(REG_OTT_HEADER);
			if (regOTT === undefined) {
				res.status(api.SC.notAllowed).json(`Missing one time token`);
				return;
			}

			const voterInfo = req.body as api.Request;

			// XXX should add checking of voterInfo

			const cert = await registerFunc(regOTT, voterInfo);
			res.status(api.SC.ok).json(cert);

		} catch (err) {
			if (err === SC.NOT_AUTHORIZED) {
				res.status(api.SC.notAllowed).json(`Invalid one time token`);
			} else {
				next(err);
			}
		}
	};
}


Object.freeze(exports);