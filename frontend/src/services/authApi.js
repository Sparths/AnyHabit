import { apiClient } from './apiClient';

export const registerApi = (payload) => apiClient.post('/auth/register', payload);

export const fetchAuthConfigApi = () => apiClient.get('/auth/config');

export const loginApi = (payload) => apiClient.post('/auth/login', payload);

export const fetchCurrentUserApi = () => apiClient.get('/auth/me');

export const logoutApi = () => apiClient.post('/auth/logout');

export const updatePreferencesApi = (payload) => apiClient.patch('/auth/me', payload);

export const changePasswordApi = (payload) => apiClient.post('/auth/password', payload);

export const deleteAccountApi = (confirmUsername) =>
  apiClient.delete(`/auth/me?confirm_username=${encodeURIComponent(confirmUsername)}`);
