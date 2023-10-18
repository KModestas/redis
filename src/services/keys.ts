// to avoid magic strings, we create utils to get each redis key.
// # denotes the id of the entity. This ensures we dont need to store it as part of the hash which saves memory. 
export const pageCacheKey = (id: string) => `pagecache#${id}`;
export const usersKey = (userId: string) => `users#${userId}`;
export const sessionsKey = (sessionId: string) => `sessions#${sessionId}`;
export const usernamesUniqueKey = () => 'usernames:unique';

// Items
export const itemsKey = (itemId: string) => `items#${itemId}`;