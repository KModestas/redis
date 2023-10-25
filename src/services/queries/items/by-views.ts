import { client } from '$services/redis';
import { itemsKey, itemsByViewsKey } from '$services/redis/keys';
import { deserialize } from './deserialize';

export const itemsByViews = async (order: 'DESC' | 'ASC' = 'DESC', offset = 0, count = 10) => {
  // run sort command on items:views zset
  // our goal is to return items sorted by views. Since the zset is already sorted, we dont use the SORT command to sort the data but rather to fetch extra fields from each item hash (rather than making 2 seperate requests)
  let results: any = await client.sort(itemsByViewsKey(), {
    GET: [
      '#', // gets the id of each element
      `${itemsKey('*')}->name`, // items#*->name 
      `${itemsKey('*')}->views`, // items#*->views 
      `${itemsKey('*')}->endingAt`,  // items#*->endingAt
      `${itemsKey('*')}->imageUrl`,
      `${itemsKey('*')}->price`
    ],
    // disable sorting (pass in a key that doesn't actually exist).
    BY: 'nosort',
    DIRECTION: order,
    LIMIT: {
      offset,
      count
    }
  });

  // our results are returned in an array of strings
  const items = [];

  while (results.length) {
    const [id, name, views, endingAt, imageUrl, price, ...rest] = results;
    const item = deserialize(id, { name, views, endingAt, imageUrl, price });
    items.push(item);
    results = rest;
  }

  return items;
};
