import { client } from '$services/redis';
import { deserialize } from './deserialize';
import { itemsIndexKey } from '$services/redis/keys';

export const searchItems = async (term: string, size: number = 5) => {
  const cleaned = term
    //  removes all characters that aren't letters, numbers, or spaces
    .replaceAll(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .split(' ')
    // wrap words in % for fuzzy search. Ignore empty strings
    .map((word) => (word ? `%${word}%` : ''))
    .join(' ');

  if (cleaned === '') {
    // no results found
    return [];
  }

  // match {name} AND OR {description} fields that contained the cleaned term.
  // {name} fields has 5x more weight
  const query = `(@name:(${cleaned}) => { $weight: 5.0 }) | (@description:(${cleaned}))`;

  // Use the client to execute search query on item hashes
  const results = await client.ft.search(itemsIndexKey(), query, {
    LIMIT: {
      // offset:
      from: 0,
      // limit:
      size
    }
  });

  // Deserialize and return the search results
  return results.documents.map(({ id, value }) => deserialize(id, value as any));
};

