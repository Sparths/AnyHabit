import { useEffect, useState } from 'react';
import { clearApiToken, getApiToken, setApiToken } from '../config/api';
import { fetchCurrentUserApi, loginApi, registerApi } from '../services/authApi';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const hydrateUser = async () => {
    const token = getApiToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await fetchCurrentUserApi();
      setUser(currentUser);
      setError('');
    } catch (requestError) {
      clearApiToken();
      setUser(null);
      setError(requestError.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    hydrateUser();
  }, []);

  const login = async (identifier, password) => {
    setError('');
    setIsAuthenticating(true);
    try {
      const response = await loginApi({ identifier, password });
      setApiToken(response.access_token);
      setUser(response.user);
      return response.user;
    } catch (requestError) {
      const errorMsg = requestError.message || 'Login failed. Please check your credentials.';
      setError(errorMsg);
      throw requestError;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const register = async (username, email, password) => {
    setError('');
    setIsAuthenticating(true);
    try {
      const response = await registerApi({ username, email, password });
      setApiToken(response.access_token);
      setUser(response.user);
      return response.user;
    } catch (requestError) {
      const errorMsg = requestError.message || 'Registration failed. Please try again.';
      setError(errorMsg);
      throw requestError;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = () => {
    clearApiToken();
    setUser(null);
    setError('');
  };

  return {
    user,
    isLoading,
    error,
    setError,
    isAuthenticating,
    login,
    register,
    logout,
    refreshUser: hydrateUser
  };
}
