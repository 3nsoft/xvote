import { RuntimeException } from "./error";

export const fileExceptionType = 'file';
	
export interface FileException extends RuntimeException {
	code: string|undefined;
	path: string;
	notFound?: true;
	alreadyExists?: true;
	notDirectory?: true;
	notFile?: true;
	notLink?: true;
	isDirectory?: true;
	notEmpty?: true;
	endOfFile?: true;
	inconsistentStateOfFS?: true;
	concurrentUpdate?: true;
}

export const Code = {
	notFound: 'ENOENT',
	alreadyExists: 'EEXIST',
	notDirectory: 'ENOTDIR',
	notFile: 'ENOTFILE',
	notLink: 'not-link',
	isDirectory: 'EISDIR',
	notEmpty: 'ENOTEMPTY',
	endOfFile: 'EEOF',
	concurrentUpdate: 'concurrent-update'
};
Object.freeze(Code);

export function makeFileException(code: string|undefined, path: string,
		cause?: any): FileException {
	const err: FileException = {
		runtimeException: true,
		type: fileExceptionType,
		code,
		path,
		cause
	};
	if (code === Code.alreadyExists) {
		err.alreadyExists = true;
	} else if (code === Code.notFound) {
		err.notFound = true;
	} else if (code === Code.isDirectory) {
		err.isDirectory = true;
	} else if (code === Code.notDirectory) {
		err.notDirectory = true;
	} else if (code === Code.notFile) {
		err.notFile = true;
	} else if (code === Code.notLink) {
		err.notLink = true;
	} else if (code === Code.endOfFile) {
		err.endOfFile = true;
	} else if (code === Code.notEmpty) {
		err.notEmpty = true;
	} else if (code === Code.concurrentUpdate) {
		err.concurrentUpdate = true;
	}
	return err;
}

export function maskPathInExc(pathPrefixMaskLen: number, exc: any):
		FileException {
	if (exc.runtimeException || !exc.code) { return exc; }
	if (typeof exc.path === 'string') {
		exc.path = exc.path.substring(pathPrefixMaskLen);
	}
	return exc;
}


Object.freeze(exports);