
const mapAmountEndings = {
		kb: 1 << 10,
		mb: 1 << 20,
		gb: 1 << 30
};

export function stringToNumOfBytes(size: string|number): number {
	if ('number' === typeof size) { return (size as number); }
	if ('string' !== typeof size) { throw new Error(
			"Given argument 'size' must be either string, or number"); }
	const parts = (size as string).match(/^(\d+(?:\.\d+)?) *(kb|mb|gb)$/);
	if (parts === null) { throw new Error(`Bad size string is given: ${size}`); }
	const n = parseFloat(parts[1]);
	const type = parts[2];
	return mapAmountEndings[type] * n;
}

Object.freeze(exports);