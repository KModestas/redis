import { client } from '$services/redis';
import { itemsKey, itemsByViewsKey } from '$services/keys';
import { deserialize } from './deserialize';

export const itemsByViews = async (order: 'DESC' | 'ASC' = 'DESC', offset = 0, count = 10) => {
  // run sort command on items:views zset
  let results: any = await client.sort(itemsByViewsKey(), {
    // TODO:
    GET: [
      '#', // gets the id of each element
      `${itemsKey('*')}->name`, // items#*->name 
      `${itemsKey('*')}->views`, // items#*->views 
      `${itemsKey('*')}->endingAt`,  // items#*->endingAt
      `${itemsKey('*')}->imageUrl`,
      `${itemsKey('*')}->price`
    ],
    // disable sorting (pass in a key that doesn't exist).
    BY: 'nosort',
    DIRECTION: order,
    LIMIT: {
      offset,
      count
    }
  });

  // our results are returned in an array of strings
  const items = [];

  console.log('results ', results)

  while (results.length) {
    const [id, name, views, endingAt, imageUrl, price, ...rest] = results;
    const item = deserialize(id, { name, views, endingAt, imageUrl, price });
    items.push(item);
    results = rest;
  }

  return items;
};
