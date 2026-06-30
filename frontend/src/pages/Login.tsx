import { useState, type FormEvent } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

const t = {
  zh: {
    loginTab: '登录',
    registerTab: '注册',
    username: '用户名',
    password: '密码',
    email: '邮箱（可选）',
    loginBtn: '登录',
    registerBtn: '注册',
    logging: '登录中…',
    registering: '注册中…',
  },
};

export function Login() {
  const { login, register } = useAuthStore();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const lang = t.zh;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(username, password);
      } else {
        await register(username, password, email || undefined);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; error?: { message?: string } } } };
      setError(
        axiosErr?.response?.data?.error?.message
        ?? axiosErr?.response?.data?.message
        ?? '请求失败，请重试'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f5f5',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: '40px 48px',
        width: 360,
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, textAlign: 'center', color: '#111827' }}>
          🍌 Banana Slides
        </h1>

        {/* Tab */}
        <div style={{ display: 'flex', marginBottom: 24, borderBottom: '1px solid #eee' }}>
          {(['login', 'register'] as const).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => { setTab(tabKey); setError(''); }}
              style={{
                flex: 1,
                padding: '8px 0',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontWeight: tab === tabKey ? 700 : 400,
                color: tab === tabKey ? '#f59e0b' : '#888',
                borderBottom: tab === tabKey ? '2px solid #f59e0b' : '2px solid transparent',
                fontSize: 15,
              }}
            >
              {tabKey === 'login' ? lang.loginTab : lang.registerTab}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 6 }}>
              {lang.username}
            </label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: 8,
                fontSize: 14,
                boxSizing: 'border-box',
                color: '#111827',
                background: '#fff',
                WebkitTextFillColor: '#111827',
                caretColor: '#111827',
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 6 }}>
              {lang.password}
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: 8,
                fontSize: 14,
                boxSizing: 'border-box',
                color: '#111827',
                background: '#fff',
                WebkitTextFillColor: '#111827',
                caretColor: '#111827',
              }}
            />
          </div>

          {tab === 'register' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 6 }}>
                {lang.email}
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  fontSize: 14,
                  boxSizing: 'border-box',
                  color: '#111827',
                  background: '#fff',
                  WebkitTextFillColor: '#111827',
                  caretColor: '#111827',
                }}
              />
            </div>
          )}

          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 6,
              padding: '8px 12px',
              color: '#dc2626',
              fontSize: 13,
              marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '11px 0',
              background: '#f59e0b',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? (tab === 'login' ? lang.logging : lang.registering)
              : (tab === 'login' ? lang.loginBtn : lang.registerBtn)}
          </button>
        </form>
      </div>
    </div>
  );
}
