
export class BytesFIFOBuffer {
	
	private queue: Uint8Array[] = [];
	private bytesLen = 0;
	get length(): number {
		return this.bytesLen;
	}
	get queueLength(): number {
		return this.queue.length;
	}
	
	constructor() {
		Object.seal(this);
	}

	clear(): void {
		this.queue = [];
		this.bytesLen = 0;
	}
	
	push(bytes: Uint8Array): void {
		if (bytes.length === 0) { return; }
		this.queue.push(bytes);
		this.bytesLen += bytes.length;
	}
	
	/**
	 * @param extractLen is number of bytes to extract. It must always be less,
	 * or equal to current length of queue.
	 * @return requested bytes
	 */
	private extractSomeBytesFrom(extractLen: number): Uint8Array|undefined {
		if (this.queue.length === 0) { return undefined; }
		const extract = new Uint8Array(extractLen);
		let offset = 0;
		while (offset < extractLen) {
			const chunk = this.queue[0];
			if ((offset + chunk.length) <= extractLen) {
				extract.set(chunk, offset);
				offset += chunk.length;
				this.queue.shift();
			} else {
				extract.set(chunk.subarray(0, extractLen-offset), offset);
				this.queue[0] = chunk.subarray(extractLen-offset);
				break;
			}
		}
		return extract;
	}
	
	private extractAllBytesFrom(): Uint8Array|undefined {
		return this.extractSomeBytesFrom(this.bytesLen);
	}
		
	/**
	 * @param len is a number of bytes to get.
	 * If undefined is given, all bytes should be returned.
	 * @return an array of bytes, or undefined, if there are not enough bytes.
	 */
	getBytes(len: number|undefined, canBeLess = false): Uint8Array|undefined {
		let extract: Uint8Array|undefined;
		if (typeof len !== 'number') {
			extract = this.extractAllBytesFrom();
		} else {
			if (len < 1) { throw new Error('Length parameter is illegal: '+len); }
			if (this.queue.length === 0) { return undefined; }
			if (this.bytesLen < len) {
				if (canBeLess) {
					extract = this.extractAllBytesFrom();
				} else {
					return undefined;
				}
			} else {
				extract = this.extractSomeBytesFrom(len);
			}
		}
		if (extract) {
			this.bytesLen -= extract.length;
		}
		return extract;
	}
	
}
Object.freeze(BytesFIFOBuffer.prototype);
Object.freeze(BytesFIFOBuffer);


Object.freeze(exports);