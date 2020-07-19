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

import * as express from 'express';
import { ServiceRunner, HttpConf } from "../lib-server/service-runner";
import { makeRegistrarResources, RegistrarResources } from './resources/registrar';
import * as adminApi from '../regitrar-app-client/api/registrar-admin';
import * as regApi from '../regitrar-app-client/api/registration';
import { emptyBody, json } from '../lib-server/middleware/body-parsers';
import { makeRegistrationOTT } from './routes/admin/make-reg-ott';
import { makeErrHandler } from '../lib-server/middleware/error-handler';
import { registrarKey } from './routes/publication/registrar-key';
import { registerVoter } from './routes/registration/register-voter';
import { getBallot } from './routes/publication/get-ballot';
import { listBallots } from './routes/publication/list-ballots';

const ADMIN_PREFIX = '/admin';

export function makeApp(resources: RegistrarResources): express.Express {

	const app = express();
	app.disable('etag');

	app.get(regApi.registrarKey.URL_END,
		registrarKey(resources.registrarKey));

	app.get(regApi.listBallots.URL_END,
		listBallots(resources.listBallots));

	app.get(regApi.getBallot.URL_END,
		getBallot(resources.getBallot));

	app.post(ADMIN_PREFIX+adminApi.makeOneTimeRegistrationToken.URL_END,
		emptyBody(),
		makeRegistrationOTT(resources.makeRegistartionOTT));

	// XXX  ==== DDoS and "cloud acceptance" ====
	// One-time-token can actually be used as a PKLogin for a single
	// registration to provide cover even after TLS termination, allowing
	// for use of big guys like CloudFront that can take DDoS pressures.

	app.put(regApi.registerVoter.URL_END,
		json('2kb'),
		registerVoter(resources.registerVoter));

	app.use(makeErrHandler((err, req): void => {
		if (typeof err.status !== 'number') {
			console.error(`\n --- Error occured in registrar app, when handling ${req.method} request to ${req.originalUrl}`);
			console.error(err);
		}
	}));

	return app;
}

export interface RegistrarConf {
	service: HttpConf;
	registrarName: string;
}

export class RegistrarApp extends ServiceRunner {

	constructor(
			private conf: RegistrarConf,
	) {
		super(conf.service);
		Object.seal(this);
	}

	protected async makeApp(): Promise<express.Express> {

		const resources = await makeRegistrarResources(this.conf.registrarName);

		const app = makeApp(resources);

		return app;
	}

}
Object.freeze(ServiceRunner.prototype);
Object.freeze(ServiceRunner);


Object.freeze(exports);