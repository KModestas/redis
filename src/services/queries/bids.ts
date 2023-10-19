import type { CreateBidAttrs, Bid } from '$services/types';
import { client } from '$services/redis';
import { bidHistoryKey } from '$services/keys';

import { DateTime } from 'luxon';

export const createBid = async (attrs: CreateBidAttrs) => { };

export const getBidHistory = async (itemId: string, offset = 0, count = 10): Promise<Bid[]> => {
	// since we can only retrieve values from a list via index, use offset and count to calculate index:
	const startIndex = -1 * offset - count;
	const endIndex = -1 - offset;

	const range = await client.lRange(bidHistoryKey(itemId), startIndex, endIndex);

	return range.map((bid) => deserializeHistory(bid)); return [];
};

const serializeHistory = (amount: number, createdAt: number) => {
	return `${amount}:${createdAt}`;
};

const deserializeHistory = (stored: string) => {
	// extract the encoded values from the string stored in the the bid history list.
	const [amount, createdAt] = stored.split(':');

	return {
		amount: parseFloat(amount),
		createdAt: DateTime.fromMillis(parseInt(createdAt))
	};
};