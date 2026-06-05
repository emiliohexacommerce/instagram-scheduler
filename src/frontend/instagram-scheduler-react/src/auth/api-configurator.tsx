import { useEffect } from 'react';
import { configureApi } from '@/lib/api';
import { useAuth } from './auth-context';

export function ApiConfigurator() {
  const { user, updateTokens, logout } = useAuth();

  useEffect(() => {
    configureApi({
      getToken: () => user?.token,
      getRefreshToken: () => user?.refreshToken,
      updateTokens,
      logout,
    });
  });

  return null;
}
