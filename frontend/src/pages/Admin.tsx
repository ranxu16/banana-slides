import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';

interface UserRow {
  id: string;
  username: string;
  email?: string;
  is_admin: boolean;
  is_active: boolean;
  project_count: number;
  created_at: string;
}

interface Overview {
  total_users: number;
  active_users: number;
  total_projects: number;
  assigned_projects?: number;
  unassigned_projects?: number;
}

export function Admin() {
  const navigate = useNavigate();
  const { user: me, logout } = useAuthStore();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 创建用户表单
  const [showCreate, setShowCreate] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const load = useCallback(async () => {
    try {
      const [ovRes, usersRes] = await Promise.all([
        apiClient.get('/api/admin/overview'),
        apiClient.get('/api/admin/users'),
      ]);
      setOverview(ovRes.data.data);
      setUsers(usersRes.data.data);
    } catch {
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (u: UserRow) => {
    try {
      await apiClient.patch(`/api/admin/users/${u.id}`, { is_active: !u.is_active });
      load();
    } catch {
      alert('更新用户状态失败');
    }
  };

  const toggleAdmin = async (u: UserRow) => {
    try {
      await apiClient.patch(`/api/admin/users/${u.id}`, { is_admin: !u.is_admin });
      load();
    } catch {
      alert('更新用户角色失败');
    }
  };

  const resetPassword = async (u: UserRow) => {
    const password = prompt(`请输入「${u.username}」的新密码（至少 6 位）`);
    if (password === null) return;
    if (password.trim().length < 6) {
      alert('新密码至少需要 6 位');
      return;
    }
    try {
      await apiClient.patch(`/api/admin/users/${u.id}`, { new_password: password.trim() });
      alert('密码已重置');
    } catch {
      alert('重置密码失败');
    }
  };

  const deleteUser = async (u: UserRow) => {
    if (!confirm(`确定删除用户「${u.username}」？`)) return;
    try {
      await apiClient.delete(`/api/admin/users/${u.id}`);
      load();
    } catch {
      alert('删除用户失败');
    }
  };

  const handleCreate = async () => {
    setCreateError('');
    if (!newUsername || !newPassword) {
      setCreateError('用户名和密码必填');
      return;
    }
    setCreating(true);
    try {
      await apiClient.post('/api/admin/users', {
        username: newUsername,
        password: newPassword,
        email: newEmail || undefined,
        is_admin: newIsAdmin,
      });
      setShowCreate(false);
      setNewUsername(''); setNewPassword(''); setNewEmail(''); setNewIsAdmin(false);
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setCreateError(e?.response?.data?.message ?? '创建失败');
    } finally {
      setCreating(false);
    }
  };

  const cellStyle: React.CSSProperties = {
    padding: '10px 14px',
    borderBottom: '1px solid #f0f0f0',
    fontSize: 14,
    color: '#1f2937',
  };

  const thStyle: React.CSSProperties = {
    ...cellStyle,
    color: '#6b7280',
    fontWeight: 600,
    background: '#fafafa',
    textAlign: 'left',
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px', color: '#1f2937' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#f9fafb' }}>管理后台</h1>
          <span style={{ fontSize: 13, color: '#888' }}>当前管理员：{me?.username}</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => navigate('/')} style={btnStyle('#6b7280')}>返回首页</button>
          <button onClick={() => { logout(); navigate('/'); }} style={btnStyle('#dc2626')}>退出登录</button>
        </div>
      </div>

      {/* Overview cards */}
      {overview && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
          {[
            { label: '总用户', value: overview.total_users },
            { label: '活跃用户', value: overview.active_users },
            {
              label: '总项目',
              value: overview.total_projects,
              hint: `已归属 ${overview.assigned_projects ?? 0}，未归属历史项目 ${overview.unassigned_projects ?? 0}`,
            },
          ].map(card => (
            <div key={card.label} style={{
              flex: 1, background: '#fff', border: '1px solid #eee',
              borderRadius: 10, padding: '20px 24px', textAlign: 'center',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              color: '#1f2937',
            }}>
              <div style={{ fontSize: 30, fontWeight: 700, color: '#f59e0b' }}>{card.value}</div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{card.label}</div>
              {'hint' in card && card.hint && (
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>{card.hint}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Users table */}
      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', color: '#1f2937' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <span style={{ fontWeight: 600, fontSize: 16, color: '#111827' }}>用户列表</span>
          <button onClick={() => setShowCreate(true)} style={btnStyle('#f59e0b')}>+ 创建用户</button>
        </div>

        {loading && <div style={{ padding: 24, color: '#888' }}>加载中…</div>}
        {error && <div style={{ padding: 24, color: '#dc2626' }}>{error}</div>}

        {!loading && !error && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['用户名', '邮箱', '角色', '状态', '项目数', '创建时间', '操作'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ background: u.id === me?.id ? '#fffbeb' : '#fff', color: '#1f2937' }}>
                  <td style={{ ...cellStyle, color: '#111827', fontWeight: 500 }}>{u.username}{u.id === me?.id && <span style={{ fontSize: 11, color: '#f59e0b', marginLeft: 6 }}>（我）</span>}</td>
                  <td style={{ ...cellStyle, color: u.email ? '#333' : '#ccc' }}>{u.email || '—'}</td>
                  <td style={cellStyle}>
                    <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 12, background: u.is_admin ? '#fef3c7' : '#f3f4f6', color: u.is_admin ? '#92400e' : '#6b7280' }}>
                      {u.is_admin ? '管理员' : '普通用户'}
                    </span>
                  </td>
                  <td style={cellStyle}>
                    <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 12, background: u.is_active ? '#dcfce7' : '#fee2e2', color: u.is_active ? '#166534' : '#991b1b' }}>
                      {u.is_active ? '活跃' : '已禁用'}
                    </span>
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>{u.project_count}</td>
                  <td style={{ ...cellStyle, color: '#888', fontSize: 12 }}>{u.created_at?.slice(0, 10) ?? '—'}</td>
                  <td style={cellStyle}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {u.id !== me?.id && (
                        <>
                          <button onClick={() => toggleActive(u)} style={smallBtn(u.is_active ? '#6b7280' : '#16a34a')}>
                            {u.is_active ? '禁用' : '启用'}
                          </button>
                          <button onClick={() => toggleAdmin(u)} style={smallBtn('#7c3aed')}>
                            {u.is_admin ? '撤销管理员' : '设为管理员'}
                          </button>
                          <button onClick={() => resetPassword(u)} style={smallBtn('#2563eb')}>重置密码</button>
                          <button onClick={() => deleteUser(u)} style={smallBtn('#dc2626')}>删除</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create user modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
        }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '32px 40px', width: 380, boxShadow: '0 8px 40px rgba(0,0,0,0.2)', color: '#1f2937' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#111827' }}>创建用户</h2>
            {[
              { label: '用户名 *', val: newUsername, set: setNewUsername, type: 'text' },
              { label: '密码 *', val: newPassword, set: setNewPassword, type: 'password' },
              { label: '邮箱', val: newEmail, set: setNewEmail, type: 'email' },
            ].map(({ label, val, set, type }) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, color: '#555', marginBottom: 4 }}>{label}</label>
                <input type={type} value={val} onChange={e => set(e.target.value)}
                  style={{ width: '100%', padding: '9px 11px', border: '1px solid #ddd', borderRadius: 7, fontSize: 14, boxSizing: 'border-box', color: '#111827', background: '#fff' }} />
              </div>
            ))}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 16, cursor: 'pointer' }}>
              <input type="checkbox" checked={newIsAdmin} onChange={e => setNewIsAdmin(e.target.checked)} />
              设为管理员
            </label>
            {createError && <div style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{createError}</div>}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowCreate(false)} style={{ ...btnStyle('#6b7280'), flex: 1 }}>取消</button>
              <button onClick={handleCreate} disabled={creating} style={{ ...btnStyle('#f59e0b'), flex: 1, opacity: creating ? 0.7 : 1 }}>
                {creating ? '创建中…' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function btnStyle(bg: string): React.CSSProperties {
  return {
    padding: '8px 16px', background: bg, color: '#fff',
    border: 'none', borderRadius: 8, fontSize: 14,
    cursor: 'pointer', fontWeight: 500,
  };
}

function smallBtn(bg: string): React.CSSProperties {
  return {
    padding: '3px 10px', background: bg, color: '#fff',
    border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer',
  };
}
