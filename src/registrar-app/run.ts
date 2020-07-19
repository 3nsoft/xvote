
import { getConfsFromEnv } from './run-config';
import { RegistrarApp } from './registrar-app';

const app = new RegistrarApp(getConfsFromEnv());
app.startOrExitProcess();
