import { client } from '$services/redis';
import { itemsIndexKey } from '$services/redis/keys';
import { deserialize } from './deserialize';

interface QueryOpts {
	page: number;
	perPage: number;
	sortBy: string;
	direction: string;
}

export const itemsByUser = async (userId: string, opts: QueryOpts) => {
	// find all indexed items that have this ownerId
	const query = `@ownerId:{${userId}}`;

	const sortCriteria = opts.sortBy &&
		opts.direction && {
		// field to sort by:
		BY: opts.sortBy,
		// ASC or DESC:
		DIRECTION: opts.direction
	};

	const { total, documents } = await client.ft.search(itemsIndexKey(), query, {
		ON: 'HASH',
		SORTBY: sortCriteria,
		LIMIT: {
			from: opts.page * opts.perPage,
			size: opts.perPage
		}
	} as any);

	return {
		totalPages: Math.ceil(total / opts.perPage),
		items: documents.map(({ id, value }) => {
			return deserialize(id.replace('items#', ''), value as any);
		})
	};
};
