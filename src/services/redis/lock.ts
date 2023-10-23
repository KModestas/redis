import { client } from './client';
import { randomBytes } from 'crypto';

// custom lock function
export const withLock = async (key: string, cb: (redisClient: Client, signal: any) => any) => {
	// Initialize a few variables to control retry behavior
	const retryDelayMs = 100;
	const timeoutMs = 2000;
	let retries = 20;

	// Generate a random value to store at the lock key
	const token = randomBytes(6).toString('hex');
	// Create the lock key
	const lockKey = `lock:${key}`;

	// Set up a while loop to implement the retry behavior 
	// NOTE: this retry strategry can be refactored with Streams + XREAD BLOCK to prevent constantly polling
	while (retries >= 0) {
		retries--;
		// Try to do a SET NX operation
		const acquired = await client.set(lockKey, token, {
			NX: true,
			PX: timeoutMs
		});

		if (!acquired) {
			// ELSE brief pause (retryDelayMs) and then retry
			await pause(retryDelayMs);
			continue;
		}

		// IF the set is successful, then run the callback
		try {
			const signal = { expired: false };

			// when lock automatically expires, tell the callback to cancel its operation. 
			setTimeout(() => {
				// NOTE: we are mutating the object, so any update to this object will be reflected inside the callback
				signal.expired = true;
			}, timeoutMs);

			// use the proxied client for the callback. This ensures that an error will be thrown if the lock expires even if we remove / forget to add the code to do in each callback.
			const proxiedClient = buildClientProxy(timeoutMs);
			const result = await cb(proxiedClient, signal);
			return result;
		} finally {
			await client.unlock(lockKey, token);
		}
	}
};

// Custom client to be used with functions that use locks. Anytime a method on the redis client is called, check if the lock has expired and throw an error
type Client = typeof client;
const buildClientProxy = (timeoutMs: number) => {
	const startTime = Date.now();

	// any time a property / method is accessed on the proxy object, this get() handler will be invoked instead
	const handler = {
		get(target: Client, prop: keyof Client) {
			if (Date.now() >= startTime + timeoutMs) {
				throw new Error('Lock has expired.');
			}

			const value = target[prop];
			return typeof value === 'function' ? value.bind(target) : value;
		}
	};

	// return the proxied version of the redis client@
	return new Proxy(client, handler) as Client;
};

const pause = (duration: number) => {
	return new Promise((resolve) => {
		setTimeout(resolve, duration);
	});
};
