import { client } from '$services/redis';
import { itemsKey, itemsByEndingAtKey } from '$services/keys';
import { deserialize } from './deserialize';

export const itemsByEndingTime = async (order: 'DESC' | 'ASC' = 'DESC', offset = 0, count = 10) => {
	// Remember, scores in a sorted set as sorted from lowest to highest. In this zset the scores are timestamps for when an item is ending
	// We include every single item in our query (from current time to infinity)
	// We then take the first 10 items which will be the items with the biggest timestamps (ending soonest - DESC)
	const ids = await client.zRange(itemsByEndingAtKey(), Date.now(), '+inf', {
		BY: 'SCORE',
		LIMIT: {
			offset,
			count
		}
	});

	// use id's of the items ending soonest to fetch their full data from the items hash
	const results = await Promise.all(ids.map((id) => client.hGetAll(itemsKey(id))));
	// remember we are not storing id for each item (to save memory) so we can access each id using ids[i]
	return results.map((item, i) => deserialize(ids[i], item));

	// NOTE: this can be refactored to use SORT like in itemsByViews() so that we can join different data structures with a single request
};
