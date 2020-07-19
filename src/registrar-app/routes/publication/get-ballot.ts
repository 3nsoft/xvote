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
import { getBallot as api } from '../../../regitrar-app-client/api/registration';
import { GetBallot } from '../../resources/registrar';
import e = require('express');

export function getBallot(getBallotFunc: GetBallot): RequestHandler {
	return async (req, res, next) => {
		try {

			const ballotNum = parseInt(req.params.ballotNum);
			if (Number.isNaN(ballotNum)) {
				res.status(api.SC.notFound).send(`Ballot not found`);
				return;
			}

			const ballotTriplet = getBallotFunc(ballotNum);
			if (ballotTriplet) {
				res.status(api.SC.ok).json(ballotTriplet);
			} else {
				res.status(api.SC.notFound).send(`Ballot not found`);
			}

		} catch (err) {
			next(err);
		}
	};
}


Object.freeze(exports);