import { itemsKey, itemsByViewsKey, itemsViewsKey } from '$services/redis/keys';

import { createClient, defineScript } from 'redis';
import { createIndexes } from './create-indexes';


const client = createClient({
	socket: {
		host: process.env.REDIS_HOST,
		port: parseInt(process.env.REDIS_PORT)
	},
	password: process.env.REDIS_PW,
	scripts: {
		unlock: defineScript({
			NUMBER_OF_KEYS: 1,
			transformArguments(key: string, token: string) {
				return [key, token];
			},
			transformReply(reply: any) {
				return reply;
			},
			SCRIPT: `
				if redis.call('GET', KEYS[1]) == ARGV[1] then
					return redis.call('DEL', KEYS[1])
				end
			`
		}),
		// script will be accessible on client.incrementView()
		incrementView: defineScript({
			// specify how many redis keys will be used in your script
			NUMBER_OF_KEYS: 3,
			SCRIPT: `
				local itemsViewsKey = KEYS[1]
				local itemsKey = KEYS[2]
				local itemsByViewsKey = KEYS[3]
				local itemId = ARGV[1]
				local userId = ARGV[2]

				local inserted = redis.call('PFADD', itemsViewsKey, userId)

				if inserted == 1 then
					redis.call('HINCRBY', itemsKey, 'views', 1)
					redis.call('ZINCRBY', itemsByViewsKey, 1, itemId)
				end
			`,
			transformArguments(itemId: string, userId: string) {
				// define all of your redis keys first followed by any other arguments
				return [
					// KEYS
					itemsViewsKey(itemId),
					itemsKey(itemId),
					itemsByViewsKey(),
					// ARGV
					itemId,
					userId
				];
			},
			// function to optionally deserialise the result of the script before returning it. 
			transformReply() {
				// we are not returning anything from our script
			}
		})
	}
});

client.on('error', (err) => console.error(err));

client.connect();

client.on('connect', async () => {
	try {
		await createIndexes();
	} catch (err) {
		console.error(err);
	}
});

export { client };
