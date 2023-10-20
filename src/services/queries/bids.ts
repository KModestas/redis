import type { CreateBidAttrs, Bid } from '$services/types';
import { client } from '$services/redis';
import { bidHistoryKey, itemsKey, itemsByPriceKey } from '$services/keys';
import { getItem } from './items';

import { DateTime } from 'luxon';

export const createBid = async (attrs: CreateBidAttrs) => {
	// execute our transaction in a new redis connection
	return client.executeIsolated(async (isolatedClient) => {
		// watch for changes to the current item that we are trying to update. Cancel the transaction if a change from elseware occurs (prevent concurrency issues)
		await isolatedClient.watch(itemsKey(attrs.itemId));

		const item = await getItem(attrs.itemId);

		if (!item) {
			throw new Error('Item does not exist');
		}
		if (item.price >= attrs.amount) {
			throw new Error('Bid too low');
		}
		if (item.endingAt.diff(DateTime.now()).toMillis() < 0) {
			throw new Error('Item closed to bidding');
		}

		const serialized = serializeHistory(attrs.amount, attrs.createdAt.toMillis());

		// execute rPush, hSet zAdd commands as part of a transaction
		return isolatedClient
			.multi()
			.rPush(bidHistoryKey(attrs.itemId), serialized)
			.hSet(itemsKey(item.id), {
				bids: item.bids + 1,
				price: attrs.amount,
				highestBidUserId: attrs.userId
			})
			.zAdd(itemsByPriceKey(), {
				value: item.id,
				score: attrs.amount
			})
			.exec();
	});
};

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