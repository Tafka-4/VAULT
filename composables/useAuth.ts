import { useRequestFetch } from '#app';
import { computed, ref } from 'vue';

type AuthUser = {
  id: string;
  email: string;
  createdAt: number;
};

type ApiResponse<T> = { data: T };

export function useAuth() {
  const user = useState<AuthUser | null>('auth:user', () => null);
  const status = useState<'idle' | 'loading' | 'ready'>('auth:status', () => 'idle');
  const lastError = useState<string | null>('auth:error', () => null);
  const refreshing = ref<Promise<void> | null>(null);
  const apiFetch = useRequestFetch();

  const refresh = async () => {
    if (refreshing.value) {
      return refreshing.value;
    }
    refreshing.value = (async () => {
      status.value = 'loading';
      lastError.value = null;
      try {
        const response = await apiFetch<ApiResponse<AuthUser>>('/api/auth/me', { credentials: 'include' }).catch(() => null);
        user.value = response?.data ?? null;
      } finally {
        status.value = 'ready';
        refreshing.value = null;
      }
    })();
    return refreshing.value;
  };

  const login = async (payload: { email: string; password: string }) => {
    lastError.value = null;
    await apiFetch<ApiResponse<AuthUser>>('/api/auth/login', {
      method: 'POST',
      body: payload,
      credentials: 'include',
    });
    await refresh();
  };

  const register = async (payload: { email: string; password: string; verificationCode: string }) => {
    lastError.value = null;
    await apiFetch<ApiResponse<AuthUser>>('/api/auth/register', {
      method: 'POST',
      body: payload,
      credentials: 'include',
    });
    await refresh();
  };

  const logout = async () => {
    await apiFetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    user.value = null;
    lastError.value = null;
    status.value = 'ready';
  };

  const isAuthenticated = computed(() => Boolean(user.value));

  return {
    user,
    status,
    lastError,
    isAuthenticated,
    refresh,
    login,
    register,
    logout,
  };
}
