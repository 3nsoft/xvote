
import { RegistrarConf } from './registrar-app';

const PORT = 80;

export function getConfsFromEnv(): RegistrarConf {
	return {
		service: {
			port: PORT
		}
	};
}


Object.freeze(exports);