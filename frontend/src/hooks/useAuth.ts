import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { LoginCredentials } from '../types';

export function useAuth() {
  const { user, token, isAuthenticated, login, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = useCallback(
    async (credentials: LoginCredentials) => {
      const data = await authService.login(credentials);
      login(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}!`);
      const role = data.user.role;
      if (role === 'ADMIN' || role === 'MANAGER') {
        navigate('/admin');
      } else {
        navigate('/pos');
      }
    },
    [login, navigate]
  );

  const handleLogout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    } finally {
      logout();
      navigate('/login');
      toast.success('Logged out successfully');
    }
  }, [logout, navigate]);

  return { user, token, isAuthenticated, login: handleLogin, logout: handleLogout };
}
