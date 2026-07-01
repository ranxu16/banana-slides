import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Clock, FileText, FolderOpen, ImageIcon, Plus, Search, Trash2 } from 'lucide-react';
import { Button, Loading, Pagination, useToast, ToastContainer, useConfirm } from '@/components/shared';
import { useProjectStore } from '@/store/useProjectStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useT } from '@/hooks/useT';
import * as api from '@/api/endpoints';
import { normalizeProject } from '@/utils';
import { formatDate, getProjectRoute, getProjectTitle, getStatusColor, getStatusText } from '@/utils/projectUtils';
import type { Project } from '@/types';

// 页面特有翻译 - AI 可以直接看到所有文案
const historyI18n = {
  zh: {
    home: { title: '光伏智呈', actions: { createProject: '创建新项目' } },
    nav: { home: '主页' },
    settings: { language: { label: '界面语言' }, theme: { light: '浅色', dark: '深色' } },
    history: {
      title: '我的项目',
      subtitle: '管理汇报项目、生成状态和导出结果',
      noProjects: '暂无项目',
      createFirst: '创建你的第一个项目开始使用吧',
      selectedCount: '已选择 {{count}} 项',
      cancelSelect: '取消选择',
      batchDelete: '批量删除',
      confirmDelete: '确定要删除项目「{{title}}」吗？此操作不可恢复。',
      confirmBatchDelete: '确定要删除选中的 {{count}} 个项目吗？此操作不可恢复。',
      deleteTitle: '确认删除',
      batchDeleteTitle: '确认批量删除',
      deleteSuccess: '成功删除 {{count}} 个项目',
      deletePartial: '成功删除 {{success}} 个项目，{{fail}} 个删除失败',
      deleteCurrentProject: '已删除项目，包括当前打开的项目',
      deleteFailed: '删除项目失败',
      openFailed: '打开项目失败',
      loadFailed: '加载历史项目失败',
      perPage: '条/页',
      searchPlaceholder: '搜索项目名称、提示词或内容',
      allStatuses: '全部状态',
      currentPageFilterHint: '搜索与筛选当前阶段先作用于当前页结果',
      myProjects: '我的项目',
      allProjects: '全部项目',
      unownedProjects: '未归属历史项目',
      continueEdit: '继续编辑',
      preview: '预览',
      export: '导出',
      updatedAt: '最近更新',
      pages: '页数',
      source: '创建方式',
      recentExport: '最近导出',
      actions: '操作',
      projectName: '项目名称',
      noExport: '暂无导出',
      failedReason: '查看失败原因',
      titleEmpty: '项目名称不能为空',
      titleUpdated: '项目名称已更新',
      titleUpdateFailed: '更新项目名称失败',
    },
  },
  en: {
    home: { title: 'PV SmartDeck', actions: { createProject: 'Create New Project' } },
    nav: { home: 'Home' },
    settings: { language: { label: 'Interface Language' }, theme: { light: 'Light', dark: 'Dark' } },
    history: {
      title: 'My Projects',
      subtitle: 'Manage report projects, generation status, and exports',
      noProjects: 'No projects yet',
      createFirst: 'Create your first project to get started',
      selectedCount: '{{count}} selected',
      cancelSelect: 'Cancel Selection',
      batchDelete: 'Batch Delete',
      confirmDelete: 'Are you sure you want to delete project "{{title}}"? This action cannot be undone.',
      confirmBatchDelete: 'Are you sure you want to delete {{count}} selected project(s)? This action cannot be undone.',
      deleteTitle: 'Confirm Delete',
      batchDeleteTitle: 'Confirm Batch Delete',
      deleteSuccess: 'Successfully deleted {{count}} project(s)',
      deletePartial: 'Deleted {{success}} project(s), {{fail}} failed',
      deleteCurrentProject: 'Deleted projects including the currently open one',
      deleteFailed: 'Failed to delete project',
      openFailed: 'Failed to open project',
      loadFailed: 'Failed to load project history',
      perPage: '/ page',
      searchPlaceholder: 'Search project title, prompt, or content',
      allStatuses: 'All statuses',
      currentPageFilterHint: 'Search and filters currently apply to this page',
      myProjects: 'My Projects',
      allProjects: 'All Projects',
      unownedProjects: 'Unowned History',
      continueEdit: 'Continue',
      preview: 'Preview',
      export: 'Export',
      updatedAt: 'Updated',
      pages: 'Pages',
      source: 'Source',
      recentExport: 'Recent Export',
      actions: 'Actions',
      projectName: 'Project',
      noExport: 'No export',
      failedReason: 'View failure reason',
      titleEmpty: 'Project name cannot be empty',
      titleUpdated: 'Project name updated',
      titleUpdateFailed: 'Failed to update project name',
    },
  },
};

const DEFAULT_PAGE_SIZE = 5;
const PAGE_SIZE_KEY = 'history_page_size';

export const History: React.FC = () => {
  const navigate = useNavigate();
  const t = useT(historyI18n); // 组件内翻译 + 自动 fallback 到全局
  const { user } = useAuthStore();
  const { syncProject, setCurrentProject } = useProjectStore();

  const [projects, setProjects] = useState<Project[]>([]);
  const [totalProjects, setTotalProjects] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem(PAGE_SIZE_KEY);
    return saved ? Number(saved) : DEFAULT_PAGE_SIZE;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('mine');
  const { show, toasts, remove } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();

  const totalPages = Math.ceil(totalProjects / pageSize);
  const statusOptions = [
    { value: 'all', label: t('history.allStatuses') },
    { value: '已完成', label: '已完成' },
    { value: '待生成图片', label: '待生成图片' },
    { value: '待生成描述', label: '待生成描述' },
    { value: '未开始', label: '未开始' },
  ];
  const filteredProjects = projects.filter((project) => {
    const title = getProjectTitle(project).toLowerCase();
    const haystack = [
      title,
      project.idea_prompt,
      project.outline_text,
      project.description_text,
      project.project_title,
    ].filter(Boolean).join(' ').toLowerCase();
    const matchesSearch = !searchQuery.trim() || haystack.includes(searchQuery.trim().toLowerCase());
    const statusText = getStatusText(project);
    const matchesStatus = statusFilter === 'all' || statusText === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const completedCount = projects.filter((project) => getStatusText(project) === '已完成').length;
  const inProgressCount = projects.filter((project) => getStatusText(project) !== '已完成' && getStatusText(project) !== '未开始').length;
  const draftCount = projects.filter((project) => getStatusText(project) === '未开始').length;

  const getProjectSource = (project: Project) => {
    if (project.description_text) return '从描述生成';
    if (project.outline_text) return '从大纲生成';
    if (project.idea_prompt) return '一句话生成';
    return '项目创建';
  };

  const loadProjects = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const offset = (page - 1) * pageSize;
      const response = await api.listProjects(pageSize, offset);
      if (response.data?.projects) {
        const normalizedProjects = response.data.projects.map(normalizeProject);
        setProjects(normalizedProjects);
        setTotalProjects(response.data.total ?? 0);
      }
    } catch (err: any) {
      console.error('加载历史项目失败:', err);
      setError(err.message || t('history.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    loadProjects(currentPage);
  }, [currentPage, pageSize]);

  const handlePageChange = useCallback((page: number) => {
    setSelectedProjects(new Set());
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    localStorage.setItem(PAGE_SIZE_KEY, String(size));
    setPageSize(size);
    setCurrentPage(1);
    setSelectedProjects(new Set());
  }, []);

  // ===== 项目选择与导航 =====

  const handleSelectProject = useCallback(async (project: Project) => {
    const projectId = project.id || project.project_id;
    if (!projectId) return;

    // 如果正在批量选择模式，不跳转
    if (selectedProjects.size > 0) {
      return;
    }

    // 如果正在编辑该项目，不跳转
    if (editingProjectId === projectId) {
      return;
    }

    try {
      // 设置当前项目
      setCurrentProject(project);
      localStorage.setItem('currentProjectId', projectId);
      
      // 同步项目数据
      await syncProject(projectId);
      
      // 根据项目状态跳转到不同页面
      const route = getProjectRoute(project);
      navigate(route, { state: { from: 'history' } });
    } catch (err: any) {
      console.error('打开项目失败:', err);
      show({
        message: t('history.openFailed') + ': ' + (err.message || t('common.unknownError')),
        type: 'error'
      });
    }
   
  }, [selectedProjects, editingProjectId, setCurrentProject, syncProject, navigate, show]);

  // ===== 批量选择操作 =====

  const handleToggleSelect = useCallback((projectId: string) => {
    setSelectedProjects(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(projectId)) {
        newSelected.delete(projectId);
      } else {
        newSelected.add(projectId);
      }
      return newSelected;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedProjects(prev => {
      if (prev.size === projects.length) {
        return new Set();
      } else {
        const allIds = projects.map(p => p.id || p.project_id).filter(Boolean) as string[];
        return new Set(allIds);
      }
    });
  }, [projects]);

  // ===== 删除操作 =====

  const deleteProjects = useCallback(async (projectIds: string[]) => {
    setIsDeleting(true);
    const currentProjectId = localStorage.getItem('currentProjectId');
    let deletedCurrentProject = false;

    try {
      // 批量删除 - 使用 allSettled 处理部分失败
      const results = await Promise.allSettled(
        projectIds.map(projectId => api.deleteProject(projectId))
      );

      const successIds = projectIds.filter((_, i) => results[i].status === 'fulfilled');
      const failCount = results.filter(r => r.status === 'rejected').length;

      // 检查是否删除了当前项目
      if (currentProjectId && successIds.includes(currentProjectId)) {
        localStorage.removeItem('currentProjectId');
        setCurrentProject(null);
        deletedCurrentProject = true;
      }

      // 清空选择
      setSelectedProjects(new Set());

      // Reload current page; if all items on this page were deleted, go back one page
      if (successIds.length > 0) {
        const remainingOnPage = projects.length - successIds.length;
        const newPage = remainingOnPage <= 0 && currentPage > 1 ? currentPage - 1 : currentPage;
        if (newPage !== currentPage) {
          // setCurrentPage triggers the useEffect which calls loadProjects
          setCurrentPage(newPage);
        } else {
          await loadProjects(newPage);
        }
      }

      if (failCount > 0 && successIds.length > 0) {
        show({
          message: t('history.deletePartial', { success: successIds.length, fail: failCount }),
          type: 'warning'
        });
      } else if (deletedCurrentProject) {
        show({
          message: t('history.deleteCurrentProject'),
          type: 'info'
        });
      } else if (successIds.length > 0) {
        show({
          message: t('history.deleteSuccess', { count: successIds.length }),
          type: 'success'
        });
      } else {
        show({
          message: t('history.deleteFailed'),
          type: 'error'
        });
      }
    } catch (err: any) {
      console.error('删除项目失败:', err);
      show({
        message: t('history.deleteFailed') + ': ' + (err.message || t('common.unknownError')),
        type: 'error'
      });
    } finally {
      setIsDeleting(false);
    }
  }, [setCurrentProject, show, projects, currentPage, loadProjects]);

  const handleDeleteProject = useCallback(async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发项目选择
    
    const projectId = project.id || project.project_id;
    if (!projectId) return;

    const projectTitle = getProjectTitle(project);
    confirm(
      t('history.confirmDelete', { title: projectTitle }),
      async () => {
        await deleteProjects([projectId]);
      },
      { title: t('history.deleteTitle'), variant: 'danger' }
    );
   
  }, [confirm, deleteProjects]);

  const handleBatchDelete = useCallback(async () => {
    if (selectedProjects.size === 0) return;

    const count = selectedProjects.size;
    confirm(
      t('history.confirmBatchDelete', { count }),
      async () => {
        const projectIds = Array.from(selectedProjects);
        await deleteProjects(projectIds);
      },
      { title: t('history.batchDeleteTitle'), variant: 'danger' }
    );
  }, [selectedProjects, confirm, deleteProjects, t]);

  // ===== 编辑操作 =====

  const handleStartEdit = useCallback((e: React.MouseEvent, project: Project) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发项目选择
    
    // 如果正在批量选择模式，不允许编辑
    if (selectedProjects.size > 0) {
      return;
    }
    
    const projectId = project.id || project.project_id;
    if (!projectId) return;
    
    const currentTitle = getProjectTitle(project);
    setEditingProjectId(projectId);
    setEditingTitle(currentTitle);
  }, [selectedProjects]);

  const handleCancelEdit = useCallback(() => {
    setEditingProjectId(null);
    setEditingTitle('');
  }, []);

  const handleSaveEdit = useCallback(async (projectId: string) => {
    const nextTitle = editingTitle.trim();

    if (!nextTitle) {
      show({ message: t('history.titleEmpty'), type: 'error' });
      return;
    }

    try {
      const targetProject = projects.find((p) => (p.id || p.project_id) === projectId);
      if (!targetProject) return;
      await api.updateProject(projectId, { project_title: nextTitle });

      // 更新本地状态
      setProjects(prev => prev.map(p => {
        const id = p.id || p.project_id;
        if (id === projectId) {
          return {
            ...p,
            project_title: nextTitle,
          };
        }
        return p;
      }));

      setEditingProjectId(null);
      setEditingTitle('');
      show({ message: t('history.titleUpdated'), type: 'success' });
    } catch (err: any) {
      console.error('更新项目名称失败:', err);
      show({
        message: t('history.titleUpdateFailed') + ': ' + (err.message || t('common.unknownError')),
        type: 'error'
      });
    }
   
  }, [editingTitle, projects, show, t]);

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent, projectId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit(projectId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  }, [handleSaveEdit, handleCancelEdit]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[22px] font-semibold leading-tight text-gray-900">{t('history.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">{t('history.subtitle')}</p>
          <p className="mt-2 text-xs text-gray-400">{t('history.currentPageFilterHint')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedProjects.size > 0 && (
            <>
              <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                {t('history.selectedCount', { count: selectedProjects.size })}
              </span>
              <Button variant="secondary" size="sm" onClick={() => setSelectedProjects(new Set())} disabled={isDeleting}>
                {t('history.cancelSelect')}
              </Button>
              <Button variant="secondary" size="sm" icon={<Trash2 size={16} />} onClick={handleBatchDelete} disabled={isDeleting} loading={isDeleting}>
                {t('history.batchDelete')}
              </Button>
            </>
          )}
          <Button size="sm" icon={<Plus size={16} />} onClick={() => navigate('/')}>
            {t('home.actions.createProject')}
          </Button>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: '项目总数', value: String(totalProjects), icon: FolderOpen, tone: 'text-gray-700 bg-gray-50' },
          { label: '当前页完成', value: String(completedCount), icon: CheckCircle2, tone: 'text-green-700 bg-green-50' },
          { label: '当前页处理中', value: String(inProgressCount), icon: Clock, tone: 'text-blue-700 bg-blue-50' },
          { label: '当前页草稿', value: String(draftCount), icon: FileText, tone: 'text-amber-700 bg-amber-50' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-gray-500">{stat.label}</p>
                  <p className="mt-1 text-xl font-semibold text-gray-900">{stat.value}</p>
                </div>
                <div className={`rounded-md p-2 ${stat.tone}`}>
                  <Icon size={18} />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_auto] lg:items-center">
          <label className="relative block">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t('history.searchPlaceholder')}
              className="h-10 w-full rounded-md border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-900 outline-none transition-colors focus:border-amber-400 focus:bg-white"
            />
          </label>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-amber-400"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          {user?.is_admin && (
            <div className="flex rounded-md border border-gray-200 bg-gray-50 p-1">
              {[
                { value: 'mine', label: t('history.myProjects') },
                { value: 'all', label: t('history.allProjects') },
                { value: 'unowned', label: t('history.unownedProjects') },
              ].map((scope) => (
                <button
                  key={scope.value}
                  type="button"
                  onClick={() => setScopeFilter(scope.value)}
                  className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                    scopeFilter === scope.value ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {scope.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-lg border border-gray-200 bg-white py-16 shadow-sm">
          <Loading message={t('common.loading')} />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-100 bg-white p-8 text-center shadow-sm">
          <AlertCircle size={36} className="mx-auto mb-3 text-red-500" />
          <p className="mb-4 text-sm text-gray-600">{error}</p>
          <Button onClick={() => loadProjects(currentPage)}>{t('common.retry')}</Button>
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
          <FolderOpen size={42} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">{t('history.noProjects')}</h3>
          <p className="mt-2 text-sm text-gray-500">{t('history.createFirst')}</p>
          <div className="mt-6 flex justify-center">
            <Button icon={<Plus size={16} />} onClick={() => navigate('/')}>{t('home.actions.createProject')}</Button>
          </div>
        </div>
      ) : (
        <section className="space-y-4">
          <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm lg:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-10 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedProjects.size === filteredProjects.length && filteredProjects.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                  </th>
                  {[t('history.projectName'), '状态', t('history.pages'), t('history.source'), t('history.updatedAt'), t('history.recentExport'), t('history.actions')].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredProjects.map((project) => {
                  const projectId = project.id || project.project_id;
                  if (!projectId) return null;
                  const title = getProjectTitle(project);
                  const pageCount = project.pages?.length || 0;
                  return (
                    <tr key={projectId} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedProjects.has(projectId)}
                          onChange={() => handleToggleSelect(projectId)}
                          className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                      </td>
                      <td className="max-w-[320px] px-4 py-4">
                        {editingProjectId === projectId ? (
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(event) => setEditingTitle(event.target.value)}
                            onKeyDown={(event) => handleTitleKeyDown(event, projectId)}
                            onBlur={() => handleSaveEdit(projectId)}
                            autoFocus
                            className="h-9 w-full rounded-md border border-amber-300 px-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-amber-200"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={(event) => handleStartEdit(event, project)}
                            className="block max-w-full truncate text-left text-sm font-medium text-gray-900 hover:text-amber-700"
                            title={title}
                          >
                            {title}
                          </button>
                        )}
                        <p className="mt-1 truncate text-xs text-gray-500">{projectId}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded px-2 py-1 text-xs font-medium ${getStatusColor(project)}`}>
                          {getStatusText(project)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">{pageCount}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{getProjectSource(project)}</td>
                      <td className="px-4 py-4 text-sm text-gray-600">{formatDate(project.updated_at || project.created_at)}</td>
                      <td className="px-4 py-4 text-sm text-gray-500">{t('history.noExport')}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="secondary" onClick={() => handleSelectProject(project)}>
                            {t('history.continueEdit')}
                          </Button>
                          <button
                            type="button"
                            onClick={(event) => handleDeleteProject(event, project)}
                            className="rounded-md p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                            title={t('common.delete')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 lg:hidden">
            {filteredProjects.map((project) => {
              const projectId = project.id || project.project_id;
              if (!projectId) return null;
              const title = getProjectTitle(project);
              return (
                <div key={projectId} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedProjects.has(projectId)}
                      onChange={() => handleToggleSelect(projectId)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-gray-900">{title}</h3>
                        <span className={`rounded px-2 py-1 text-xs font-medium ${getStatusColor(project)}`}>
                          {getStatusText(project)}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                        <span><FileText size={13} className="mr-1 inline" />{project.pages?.length || 0} {t('history.pages')}</span>
                        <span><Clock size={13} className="mr-1 inline" />{formatDate(project.updated_at || project.created_at)}</span>
                        <span><ImageIcon size={13} className="mr-1 inline" />{getProjectSource(project)}</span>
                        <span>{t('history.noExport')}</span>
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <Button size="sm" onClick={() => handleSelectProject(project)}>{t('history.continueEdit')}</Button>
                        <Button size="sm" variant="secondary" onClick={(event) => handleDeleteProject(event, project)}>{t('common.delete')}</Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProjects.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
              没有匹配当前搜索和筛选条件的项目。
            </div>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
            pageSizeLabel={t('history.perPage')}
          />
        </section>
      )}

      <ToastContainer toasts={toasts} onRemove={remove} />
      {ConfirmDialog}
    </div>
  );
};
