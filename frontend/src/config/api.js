export const API_URL = import.meta.env.VITE_API_URL || '';

const TOKEN_STORAGE_KEY = 'anyhabit_access_token';

let inMemoryToken = typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_STORAGE_KEY) || '' : '';

export function setApiToken(token) {
	inMemoryToken = token || '';
	if (typeof window !== 'undefined') {
		if (inMemoryToken) {
			window.localStorage.setItem(TOKEN_STORAGE_KEY, inMemoryToken);
		} else {
			window.localStorage.removeItem(TOKEN_STORAGE_KEY);
		}
	}
}

export function getApiToken() {
	return inMemoryToken;
}

export function clearApiToken() {
	setApiToken('');
}
