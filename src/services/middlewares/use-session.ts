import type { Handle } from '@sveltejs/kit';
import type { Session } from '$services/types';
import { randomBytes } from 'crypto';
import keygrip from 'keygrip';
import { serialize, parse } from 'cookie';
import { getSession, saveSession } from '$services/queries/sessions';

const keys = new keygrip([process.env.COOKIE_KEY || 'alskdjf']);

// NOTE: "event" is also often named as "request"
export const useSession: Handle = async ({ event, resolve }) => {
	// extract cookie from header of the request
	const { auth } = parse(event.request.headers.get('cookie') || '');

	let sessionId = '';
	let sig = '';
	if (auth) {
		[sessionId, sig] = auth.split(':');
	}

	let session: Session;

	// found valid cookie but session doesn't exist, create it:
	if (!sessionId || !keys.verify(sessionId, sig)) {
		session = await createSession();
	} else {
		session = (await getSession(sessionId)) || { id: '', userId: '', username: '' };
	}

	// makes the session avaliable in other hooks 
	event.locals.session = session;
	const res = await resolve(event);

	if (event.locals.session) {
		// save session in redis as a hash
		await saveSession(event.locals.session);
		res.headers.set('set-cookie', sessionToCookie(session.id));
	} else {
		res.headers.set('set-cookie', unsetSession());
	}

	return res;
};

const createSession = async (): Promise<Session> => {
	const id = randomBytes(4).toString('hex');

	const session = {
		id,
		// currently only storing a sessionId
		userId: '',
		username: ''
	};

	await saveSession(session);

	return session;
};

const unsetSession = () => {
	return serialize('auth', '', {
		httpOnly: false,
		path: '/',
		maxAge: 60 * 60 * 24 * 7 * 52
	});
};

const sessionToCookie = (sessionId: string) => {
	return serialize('auth', `${sessionId}:${keys.sign(sessionId)}`, {
		httpOnly: false,
		path: '/',
		maxAge: 60 * 60 * 24 * 7 * 52
	});
};
