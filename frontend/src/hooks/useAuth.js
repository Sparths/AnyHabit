import { useCallback, useEffect, useState } from 'react';
import {
  changePasswordApi,
  deleteAccountApi,
  fetchAuthConfigApi,
  fetchCurrentUserApi,
  loginApi,
  logoutApi,
  registerApi,
  updatePreferencesApi
} from '../services/authApi';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);

  const hydrateUser = useCallback(async () => {
    try {
      const authConfig = await fetchAuthConfigApi();
      setRegistrationEnabled(authConfig.registration_enabled);
      setUser(await fetchCurrentUserApi());
      setError('');
    } catch (requestError) {
      setUser(null);
      // A 401 here just means "not signed in yet", which is not an error the
      // user needs to read on the sign-in screen.
      if (requestError.status !== 401) {
        setError(requestError.message || 'Authentication failed');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrateUser();
  }, [hydrateUser]);

  const runAuthAction = useCallback(async (action, fallbackMessage) => {
    setError('');
    setIsAuthenticating(true);
    try {
      const response = await action();
      setUser(response.user);
      return response.user;
    } catch (requestError) {
      setError(requestError.message || fallbackMessage);
      throw requestError;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const login = useCallback(
    (identifier, password) =>
      runAuthAction(
        () => loginApi({ identifier, password }),
        'Sign-in failed. Please check your credentials.'
      ),
    [runAuthAction]
  );

  const register = useCallback(
    (username, email, password) =>
      runAuthAction(() => registerApi({ username, email, password }), 'Registration failed. Please try again.'),
    [runAuthAction]
  );

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // The cookie may already be gone; clearing local state is what matters.
    }
    setUser(null);
    setError('');
  }, []);

  const updatePreferences = useCallback(async (payload) => {
    const updated = await updatePreferencesApi(payload);
    setUser(updated);
    return updated;
  }, []);

  const changePassword = useCallback((payload) => changePasswordApi(payload), []);

  const deleteAccount = useCallback(async (confirmUsername) => {
    await deleteAccountApi(confirmUsername);
    setUser(null);
  }, []);

  return {
    user,
    isLoading,
    error,
    setError,
    isAuthenticating,
    login,
    register,
    logout,
    updatePreferences,
    changePassword,
    deleteAccount,
    refreshUser: hydrateUser,
    registrationEnabled
  };
}
