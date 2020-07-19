
import { RegistrarConf } from './registrar-app';

const PORT = 80;

export function getConfsFromEnv(): RegistrarConf {
	return {
		service: {
			port: PORT
		},
		registrarName: 'Ballots Registrar'
	};
}


Object.freeze(exports);