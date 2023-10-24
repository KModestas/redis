import { randomBytes, scrypt } from 'crypto';
import { createUser, getUserByUsername } from '$services/queries/users';

export const signup = async (username: string, password: string) => {
	const [hashed, salt] = await saltAndHash(password);

	const userId = createUser({
		username,
		password: `${hashed}.${salt}`
	});

	return userId
};

export const signin = async (username: string, password: string): Promise<string> => {
	// return deserialized user hash
	const user = await getUserByUsername(username);

	if (!user) {
		throw new Error('Username does not exist');
	}

	const matches = await comparePasswords(password, user.password);

	if (matches) {
		return user.id;
	}

	throw new Error('Invalid password');
};

// check if password user typed in is equal to the password stored in the DB
const comparePasswords = async (password: string, encryptedPassword: string) => {
	const [hashed, salt] = encryptedPassword.split('.');

	return new Promise((resolve, reject) => {
		scrypt(password, salt, 32, (err, key) => {
			if (err) {
				reject(err);
			}

			resolve(key.toString('hex') === hashed);
		});
	});
};

const saltAndHash = (password: string): Promise<[string, string]> => {
	// salt ensures that even users with the same password get a different hash (prevent rainbow table attacks)
	const salt = randomBytes(4).toString('hex');

	return new Promise((resolve, reject) => {
		scrypt(password, salt, 32, (err, key) => {
			if (err) {
				reject(err);
			}

			resolve([key.toString('hex'), salt]);
		});
	});
};
