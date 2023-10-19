import { client } from "$services/redis";
import { itemsKey, itemsByViewsKey } from "$services/keys";

export const incrementView = async (itemId: string, userId: string) => {
  return Promise.all([
    client.hIncrBy(itemsKey(itemId), 'views', 1),
    // arguments for hIncryBy and zIncryBy are reversed...
    client.zIncrBy(itemsByViewsKey(), 1, itemId)
  ])
};
