import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Landing } from './pages/Landing';
import { History } from './pages/History';
import { OutlineEditor } from './pages/OutlineEditor';
import { DetailEditor } from './pages/DetailEditor';
import { SlidePreview } from './pages/SlidePreview';
import { SettingsPage } from './pages/Settings';
import { Admin } from './pages/Admin';
import { useProjectStore } from './store/useProjectStore';
import { useToast, ToastContainer, AuthGuard } from './components/shared';
import { useAuthStore } from './store/useAuthStore';
import { setUnauthorizedHandler } from './api/client';

function App() {
  const { currentProject, syncProject, error, setError } = useProjectStore();
  const { show, toasts, remove } = useToast();
  const { user, token, logout } = useAuthStore();

  // 注册 401 回调，token 失效时直接登出（不 reload）
  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  // 已登录时才恢复项目状态
  useEffect(() => {
    if (!token) return;
    const savedProjectId = localStorage.getItem('currentProjectId');
    if (savedProjectId && !currentProject) {
      syncProject();
    }
  }, [token, currentProject, syncProject]);

  // 显示全局错误
  useEffect(() => {
    if (error) {
      show({ message: error, type: 'error' });
      setError(null);
    }
  }, [error, setError, show]);

  return (
    <AuthGuard>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/history" element={<History />} />
          {user?.is_admin && <Route path="/settings" element={<SettingsPage />} />}
          {user?.is_admin && <Route path="/admin" element={<Admin />} />}
          <Route path="/project/:projectId/outline" element={<OutlineEditor />} />
          <Route path="/project/:projectId/detail" element={<DetailEditor />} />
          <Route path="/project/:projectId/preview" element={<SlidePreview />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer toasts={toasts} onRemove={remove} />
      </BrowserRouter>
    </AuthGuard>
  );
}

export default App;

