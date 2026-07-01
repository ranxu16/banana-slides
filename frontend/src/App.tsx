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
import { AppShell } from './components/layout';
import { useAuthStore } from './store/useAuthStore';
import { setUnauthorizedHandler } from './api/client';

function PlaceholderPage({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8">
      <div className="max-w-2xl">
        <div className="mb-3 inline-flex rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
          后续阶段接入
        </div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item} className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
                <PlaceholderPage
                  title="模板中心将在后续阶段接入"
                  description="这里会承接模板搜索、分组、缩略图、设为默认和使用模板等能力。当前先开放入口，避免一级导航长期不可点击。"
                  items={['模板搜索与筛选', '常用业务场景模板', '设为全局默认模板', '从工作台直接使用']}
                />
              </AppShell>
            }
          />
          <Route
            path="/materials"
            element={
              <AppShell title="素材中心" description="管理光伏业务图片、图标、品牌资产和常用素材">
                <PlaceholderPage
                  title="素材中心将在后续阶段接入"
                  description="这里会承接素材上传、搜索、分组、可见范围和插入到编辑器等能力。当前先保留可进入的资源管理入口。"
                  items={['产品与项目图片', '品牌图标与视觉资产', '个人/团队/全局可见范围', '编辑页素材复用']}
                />
              </AppShell>
            }
          />
          <Route
            path="/exports"
            element={
              <AppShell title="导出任务" description="查看、下载和排查 PPTX/PDF/可编辑 PPTX 导出任务">
                <PlaceholderPage
                  title="导出任务中心将在后续阶段接入"
                  description="这里会承接全局任务列表、失败原因、下载、重试和清理历史。当前先开放入口，后续替代仅在预览页出现的任务面板。"
                  items={['进行中任务', '失败原因与重试', '成功文件下载', '任务轮询受控停止']}
                />
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
