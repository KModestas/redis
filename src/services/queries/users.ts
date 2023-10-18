import type { CreateUserAttrs } from '$services/types';
import { genId } from '$services/utils';
import { client } from '$services/redis';
import { usersKey, usernamesUniqueKey, usernamesKey } from '$services/keys';

// NOTE: could use a hash instead of a sorted set to store usernames to id's and then we wouldn't have to convert the id from number to string and vice versa
export const getUserByUsername = async (username: string) => {
  // Use the username argument to look up the persons User ID in the usernames sorted set
  // NOTE: decimal actually means base10, hexadecimal means base 16
  const decimalId = await client.zScore(usernamesKey(), username);

  // make sure we actually got an ID from the lookup
  if (!decimalId) {
    throw new Error('User does not exist');
  }

  // Take the id and convert it back to hex
  const id = decimalId.toString(16);
  // Use the id to look up the user's hash
  const user = await client.hGetAll(usersKey(id));

  // deserialize and return the hash
  return deserialize(id, user);
};

export const getUserById = async (id: string) => {
  const user = await client.hGetAll(usersKey(id));

  return deserialize(id, user);
};

export const createUser = async (attrs: CreateUserAttrs) => {
  const id = genId();

  const exists = await client.sIsMember(usernamesUniqueKey(), attrs.username);
  if (exists) {
    throw new Error('Username is taken');
  }

  await client.hSet(usersKey(id), serialize(attrs));
  // NOTE: usernamesUnique set is redundant and can be replaced by usernames sorted set (just here to have an example of a regular set)
  await client.sAdd(usernamesUniqueKey(), attrs.username);
  await client.zAdd(usernamesKey(), {
    value: attrs.username,
    // the id we generate is expressed as a hexadecimal string, we need to convert it into a number giving it the node-redis library. (it will convert the hex string into a base 10 number)
    score: parseInt(id, 16)
  });

  return id;
};

const serialize = (user: CreateUserAttrs) => {
  return {
    username: user.username,
    password: user.password
  };
};

const deserialize = (id: string, user: { [key: string]: string }) => {
  return {
    id,
    username: user.username,
    password: user.password
  };
};

