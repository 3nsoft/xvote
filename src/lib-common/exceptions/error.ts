
export interface ErrorWithCause extends Error {
	cause: any;
}
	
export interface RuntimeException {
	runtimeException: true;
	type?: string;
	cause?: any;
}

export function errWithCause(cause: any, message: string): ErrorWithCause {
	const err = <ErrorWithCause> new Error(message);
	err.cause = cause;
	return err;
}

export function stringifyErr(err: any): string {
	if ((err as RuntimeException).runtimeException || !err
	|| (typeof err !== 'object')) {
		return `${JSON.stringify(err, null, '  ')}
`;
	} else {
		return `Error message: ${err.message}
Error stack: ${err.stack}${
	((err as ErrorWithCause).cause ? `
Caused by:
${stringifyErr((err as ErrorWithCause).cause)}` :
	'')}
`;
	}
}

Object.freeze(exports);