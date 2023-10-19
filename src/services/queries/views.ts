import { client } from "$services/redis";
import { itemsKey, itemsByViewsKey, itemsViewsKey } from "$services/keys";

export const incrementView = async (itemId: string, userId: string) => {
  // log user view for item in the hyperloglog
  const inserted = await client.pfAdd(itemsViewsKey(itemId), userId)

  if (!inserted) return

  return Promise.all([
    client.hIncrBy(itemsKey(itemId), 'views', 1),
    // arguments for hIncryBy and zIncryBy are reversed...
    client.zIncrBy(itemsByViewsKey(), 1, itemId)
  ])
};
