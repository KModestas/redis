// to avoid typos, we create utils to generate each redis key.
// : denotes the entity e.g. users
// # denotes the individual id of each entity. This ensures we dont need to store it as part of the hash (saves memory) 

// comments on the right denote datatype being stored under each key
export const pageCacheKey = (id: string) => `pagecache#${id}`; // STRING
export const usersKey = (userId: string) => `users#${userId}`; // HASH
export const sessionsKey = (sessionId: string) => `sessions#${sessionId}`; // HASH
export const usernamesUniqueKey = () => 'usernames:unique'; // SET
export const userLikesKey = (userId: string) => `users:likes#${userId}` // SET
export const usernamesKey = () => 'usernames'; // SORTED SET (ZSET)

// Items                                                                          
export const itemsKey = (itemId: string) => `items#${itemId}`; // HASH
export const bidHistoryKey = (itemId: string) => `history#${itemId}`; // LIST
export const itemsViewsKey = (itemId: string) => `items:views#${itemId}`; // HYPERLOGLOG 
export const itemsByViewsKey = () => 'items:views'; // SORTED SET (ZSET)
export const itemsByEndingAtKey = () => 'items:endingAt'; // SORTED SET (ZSET)
export const itemsByPriceKey = () => 'items:price'; // SORTED SET (ZSET)
export const itemsIndexKey = () => 'idx:items'; // INDEX (RediSearch)
