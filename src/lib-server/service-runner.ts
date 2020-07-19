
import * as http from 'http';
import * as https from 'https';
import * as express from 'express';
import { readFileSync } from 'fs';
import { errWithCause } from '../lib-common/exceptions/error';
import * as getopts from 'getopts';

export interface HttpConf {
	hostname?: string;
	port: number;
	sslOpts?: https.ServerOptions;
}

type HttpServer = http.Server | https.Server;

export const CONF_ARG = 'service-conf';

export abstract class ServiceRunner {

	private server: HttpServer|undefined = undefined;
	private closingProc: Promise<void>|undefined = undefined;
	private cleanups: (() => Promise<void>)[] = [];

	protected constructor(
			private httpConf: HttpConf) {
	}

	static readConfFromFile(): any {
		const cliOpts = getopts(process.argv.slice(2));
		const file = cliOpts[CONF_ARG];
		if (typeof file !== 'string') { throw new Error(
			`Missing ${CONF_ARG} argument, or it has no path to config file.`); }
		try {
			return JSON.parse(readFileSync(file, 'utf8'));
		} catch (err) {
			throw errWithCause(err, `Have problem parsing config file ${file}`);
		}
	}
	
	protected abstract makeApp(): Promise<express.Express>;

	protected addCleanup(cleanup: () => Promise<void>): void {
		this.cleanups.push(cleanup);
	}

	async start(): Promise<void> {
		if (this.server) { throw new Error(`Server is already set`); }

		// setup server
		const app = await this.makeApp();
		this.server = (this.httpConf.sslOpts ?
			https.createServer(this.httpConf.sslOpts, app) :
			http.createServer(app));

		// start listening
		this.closingProc = undefined;
		await (new Promise<void>((resolve, reject) => {
			const cb = (err) => {
				if (err) { reject(err); }
				else { resolve(); }
			};
			if (this.httpConf.hostname) {
				this.server!.listen(this.httpConf.port, this.httpConf.hostname, cb);
			} else {
				this.server!.listen(this.httpConf.port, cb);
			}
		}));
		
		this.attachStopSignalListeners();

	}

	startOrExitProcess(): void {
		this.start().catch(err => {
			console.error(`Cannot start app due to the following error:`);
			console.error(err);
			process.exit(-1);
		});
	}

	private attachStopSignalListeners(): void {
		const sigintListener = () => this.stop();
		process.on('SIGINT', sigintListener);
		process.on('SIGTERM', sigintListener);
		this.addCleanup(async () => {
			process.removeListener('SIGINT', sigintListener);
			process.removeListener('SIGTERM', sigintListener);
		});
	}

	async stop(): Promise<void> {
		if (!this.server) { return; }
		if (!this.closingProc) {
			this.closingProc = new Promise<void>((resolve, reject) => {
				const cb = (err) => {
					if (err) { reject(err); }
					else { resolve(); }
				};
				this.server!.close(cb);
				this.server = undefined;
			}).then(async () => { 
				await this.performCleanups();
			}, async err => {
				await this.performCleanups();
				console.error(err);
			});
		}
		await this.closingProc;
	}

	private async performCleanups(): Promise<void> {
		const promises: Promise<void>[] = [];
		for (const cleanup of this.cleanups) {
			promises.push(cleanup());
		}
		this.cleanups = [];
		await Promise.all(promises);
	}

}
Object.freeze(ServiceRunner.prototype);
Object.freeze(ServiceRunner);

Object.freeze(exports);