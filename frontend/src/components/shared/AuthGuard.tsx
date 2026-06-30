import { useEffect, useState, type ReactNode } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Login } from '@/pages/Login';

/**
 * AuthGuard — 替代 AccessCodeGuard
 * 未登录时显示登录页，已登录时渲染子组件。
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { token, user, fetchMe } = useAuthStore();
  const [checkedToken, setCheckedToken] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setCheckedToken(null);
      return;
    }

    let alive = true;
    void fetchMe().finally(() => {
      if (alive) {
        setCheckedToken(token);
      }
    });

    return () => {
      alive = false;
    };
  }, [token, fetchMe]);

  if (!token) {
    return <Login />;
  }

  if (!user || checkedToken !== token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-700">
        正在恢复登录状态…
      </div>
    );
  }

  return <>{children}</>;
}
