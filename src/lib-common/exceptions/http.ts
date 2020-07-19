import { RuntimeException } from "./error";

/**
 * This module contains some code and type declarations that are common for
 * both main and worker processes.
 */

interface HTTPErrorDetails extends RuntimeException {
	url: string;
	method: string;
	message?: string;
}

export interface ConnectException extends HTTPErrorDetails {
	type: 'http-connect';
}

export interface HTTPException extends HTTPErrorDetails {
	type: 'http-request';
	status: number;
}

export function makeConnectionException(url: string|undefined,
		method: string|undefined, msg?: string, cause?: any): ConnectException {
	const exc: ConnectException = {
		runtimeException: true,
		type: 'http-connect',
		url: url!,
		method: method!,
		cause
	};
	if (msg) {
		exc.message = msg;
	}
	return exc;
}

export function makeHTTPException(url: string, method: string, status: number,
		msg?: string, cause?: any): HTTPException {
	const exc: HTTPException = {
		runtimeException: true,
		type: 'http-request',
		url: url,
		method: method,
		status: status,
		cause
	};
	if (msg) {
		exc.message = msg;
	}
	return exc;
}

Object.freeze(exports);