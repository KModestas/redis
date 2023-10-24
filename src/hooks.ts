import 'dotenv/config';
import '$services/redis/client';
import boxen from 'boxen';
import { DateTime } from 'luxon';
import type { Handle, GetSession } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { useCachePage, useSession, useErrors } from '$services/middlewares';

if (!process.env.REDIS_HOST) {
	console.error(
		boxen('You must specify Redis connection info in the .env file', {
			padding: 1,
			margin: 1,
			borderStyle: 'double'
		})
	);
	process.exit(1);
}

// runs these hooks for every request
export const handle: Handle = sequence(useErrors, useCachePage, useSession);

// The returned session object is passed to the load function in your components and also to your layout and page components as a session prop  
// useful for populating session-dependent data, like user information, so you don't have to fetch it in each component.
export const getSession: GetSession = (event) => {
	// this is being set inside of useSession 
	return event.locals.session;
};

DateTime.prototype.toString = function () {
	return this.toMillis();
};
DateTime.prototype.toJSON = function () {
	return this.toMillis();
};
