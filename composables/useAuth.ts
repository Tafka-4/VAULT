import { useRequestFetch } from '#app';
import { computed, ref, watch } from 'vue';

type AuthUser = {
  id: string;
  email: string;
  createdAt: number;
};

type ApiResponse<T> = { data: T };

export function useAuth() {
  const storedUser = process.client
    ? (() => {
        try {
          return JSON.parse(localStorage.getItem('vault:user') || 'null') as AuthUser | null;
        } catch {
          return null;
        }
      })()
    : null;

  const user = useState<AuthUser | null>('auth:user', () => storedUser);
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
        if (response?.data) {
          user.value = response.data;
        }
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

  const recoverPassword = async (payload: { email: string; password: string; verificationCode?: string; resetToken?: string }) => {
    lastError.value = null;
    await apiFetch<ApiResponse<AuthUser>>('/api/auth/recover', {
      method: 'POST',
      body: payload,
      credentials: 'include',
    });
    await refresh();
  };

  const requestPasswordReset = async (payload: { email: string }) => {
    lastError.value = null;
    await apiFetch<ApiResponse<{ sent: boolean }>>('/api/auth/forgot', {
      method: 'POST',
      body: payload,
      credentials: 'include',
    });
  };

  const updateProfile = async (payload: { email?: string; password?: string; currentPassword: string }) => {
    lastError.value = null;
    await apiFetch<ApiResponse<AuthUser>>('/api/account/profile', {
      method: 'PATCH',
      body: payload,
      credentials: 'include',
    });
    await refresh();
  };

  const loginWithResetToken = async (token: string) => {
    lastError.value = null;
    await apiFetch<ApiResponse<AuthUser>>('/api/auth/reset-session', {
      method: 'POST',
      body: { token },
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

  if (process.client) {
    watch(
      user,
      (val) => {
        if (val) {
          localStorage.setItem('vault:user', JSON.stringify(val));
        } else {
          localStorage.removeItem('vault:user');
        }
      },
      { deep: true },
    );
  }

  return {
    user,
    status,
    lastError,
    isAuthenticated,
    refresh,
    login,
    register,
    recoverPassword,
    requestPasswordReset,
    updateProfile,
    loginWithResetToken,
    logout,
  };
}
