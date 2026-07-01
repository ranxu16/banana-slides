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
import { ExportTasks } from './pages/ExportTasks';
import { Templates } from './pages/Templates';
import { Materials } from './pages/Materials';
import { useProjectStore } from './store/useProjectStore';
import { useToast, ToastContainer, AuthGuard } from './components/shared';
import { AppShell } from './components/layout';
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
          <Route path="/" element={<AppShell><Home /></AppShell>} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/history" element={<AppShell><History /></AppShell>} />
          <Route
            path="/templates"
            element={
              <AppShell title="模板中心" description="管理汇报模板、业务场景和默认模板策略">
                <Templates />
              </AppShell>
            }
          />
          <Route
            path="/materials"
            element={
              <AppShell title="素材中心" description="管理光伏业务图片、图标、品牌资产和常用素材">
                <Materials />
              </AppShell>
            }
          />
          <Route
            path="/exports"
            element={
              <AppShell title="导出任务" description="查看、下载和排查 PPTX/PDF/可编辑 PPTX 导出任务">
                <ExportTasks />
              </AppShell>
            }
          />
          {user?.is_admin && (
            <Route
              path="/settings"
              element={
                <AppShell
                  title="全局配置"
                  description="统一管理模型、生成、导出、解析与服务连接默认策略"
                >
                  <SettingsPage />
                </AppShell>
              }
            />
          )}
          {user?.is_admin && (
            <Route
              path="/admin"
              element={
                <AppShell title="用户管理" description="管理账号、角色、状态和项目归属统计">
                  <Admin />
                </AppShell>
              }
            />
          )}
          <Route path="/project/:projectId/outline" element={<AppShell><OutlineEditor /></AppShell>} />
          <Route path="/project/:projectId/detail" element={<AppShell><DetailEditor /></AppShell>} />
          <Route path="/project/:projectId/preview" element={<AppShell><SlidePreview /></AppShell>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer toasts={toasts} onRemove={remove} />
      </BrowserRouter>
    </AuthGuard>
  );
}

export default App;
