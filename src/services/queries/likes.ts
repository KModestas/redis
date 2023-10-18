import { client } from '$services/redis';
import { userLikesKey, itemsKey } from '$services/keys';
import { getItems } from './items';

export const userLikesItem = async (itemId: string, userId: string) => {
  return client.sIsMember(userLikesKey(userId), itemId);
};

export const likedItems = async (userId: string) => {
  // Fetch all the item ID's from this user's liked set
  const ids = await client.sMembers(userLikesKey(userId));

  // Fetch all the item hashes with those ids and return as array
  return getItems(ids);
};

export const likeItem = async (itemId: string, userId: string) => {
  // add this item to the hash containing all the items that the user has liked
  const inserted = await client.sAdd(userLikesKey(userId), itemId);

  // only increment total likes on the item hash if the user succesfully liked the item
  if (inserted) {
    return client.hIncrBy(itemsKey(itemId), 'likes', 1);
  }
};

export const unlikeItem = async (itemId: string, userId: string) => {
  const removed = await client.sRem(userLikesKey(userId), itemId);

  if (removed) {
    // pass in -1 to decrement the key in the hash
    return client.hIncrBy(itemsKey(itemId), 'likes', -1);
  }
};

export const commonLikedItems = async (userOneId: string, userTwoId: string) => {
  // find intersection between 2 sets:
  const ids = await client.sInter([
    userLikesKey(userOneId),
    userLikesKey(userTwoId)
  ]);

  return getItems(ids);
};
