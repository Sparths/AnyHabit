import { useEffect, useState } from 'react';
import { fetchCurrentUserApi, loginApi, logoutApi, registerApi } from '../services/authApi';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const hydrateUser = async () => {
    try {
      const currentUser = await fetchCurrentUserApi();
      setUser(currentUser);
      setError('');
    } catch (requestError) {
      setUser(null);
      if (requestError.status !== 401) {
        setError(requestError.message || 'Authentication failed');
      }
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

  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error(error);
    }
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
