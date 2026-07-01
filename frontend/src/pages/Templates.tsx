import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, LayoutTemplate, RefreshCw, Search, Trash2, UploadCloud } from 'lucide-react';
import { Button, Input, Loading, ToastContainer, useConfirm, useToast } from '@/components/shared';
import * as api from '@/api/endpoints';
import type { UserTemplate } from '@/api/endpoints';

const getTemplateName = (template: UserTemplate) => (
  template.name || `模板 ${template.template_id.slice(0, 8)}`
);

const formatDateTime = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const Templates: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { show, toasts, remove } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const [templates, setTemplates] = useState<UserTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sceneFilter, setSceneFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.listUserTemplates();
      setTemplates(response.data?.templates || []);
    } catch (err: any) {
      const message = err?.response?.data?.error?.message || err?.message || '加载模板失败';
      setError(message);
      show({ message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const filteredTemplates = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return templates.filter((template) => {
      const name = getTemplateName(template).toLowerCase();
      const scene = sceneFilter === 'all' || sceneFilter === 'pv';
      return scene && (!keyword || name.includes(keyword) || template.template_id.toLowerCase().includes(keyword));
    });
  }, [query, sceneFilter, templates]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const name = file.name.replace(/\.[^.]+$/, '');
      await api.uploadUserTemplate(file, name);
      show({ message: '模板已上传', type: 'success' });
      await loadTemplates();
    } catch (err: any) {
      show({ message: err?.response?.data?.error?.message || err?.message || '上传模板失败', type: 'error' });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const deleteTemplate = async (template: UserTemplate) => {
    setDeletingId(template.template_id);
    try {
      await api.deleteUserTemplate(template.template_id);
      setTemplates((prev) => prev.filter((item) => item.template_id !== template.template_id));
      show({ message: '模板已删除', type: 'success' });
    } catch (err: any) {
      show({ message: err?.response?.data?.error?.message || err?.message || '删除模板失败', type: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDelete = (template: UserTemplate) => {
    confirm(
      `确定删除「${getTemplateName(template)}」吗？此操作不可恢复。`,
      () => deleteTemplate(template),
      { title: '删除模板', confirmText: '删除', cancelText: '取消', variant: 'danger' }
    );
  };

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={remove} />
      {ConfirmDialog}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />

      <div className="space-y-6">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <div className="text-xs font-medium text-gray-500">模板总数</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{templates.length}</div>
          </div>
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <div className="text-xs font-medium text-gray-500">光伏业务场景</div>
            <div className="mt-2 text-base font-semibold text-gray-900">汇报 / 复盘 / 培训</div>
          </div>
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <div className="text-xs font-medium text-gray-500">默认模板</div>
            <div className="mt-2 text-base font-semibold text-gray-900">后续接入</div>
          </div>
        </div>

        <div className="rounded-md border border-gray-200 bg-white p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_220px_auto_auto]">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-3 text-gray-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索模板名称或 ID"
                className="pl-10"
                aria-label="搜索模板"
              />
            </div>
            <select
              value={sceneFilter}
              onChange={(event) => setSceneFilter(event.target.value)}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
              aria-label="场景筛选"
            >
              <option value="all">全部场景</option>
              <option value="pv">光伏业务</option>
            </select>
            <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={loadTemplates} disabled={isLoading}>
              刷新
            </Button>
            <Button icon={<UploadCloud size={16} />} onClick={() => fileInputRef.current?.click()} loading={isUploading}>
              上传模板
            </Button>
          </div>
          {error && <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        </div>

        {isLoading ? (
          <div className="rounded-md border border-gray-200 bg-white py-14">
            <Loading message="正在加载模板" />
          </div>
        ) : filteredTemplates.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredTemplates.map((template) => {
              const previewUrl = template.thumb_url || template.template_image_url;
              return (
                <div key={template.template_id} className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
                  <div className="aspect-video bg-gray-100">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt={getTemplateName(template)}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        <LayoutTemplate size={28} />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-gray-900" title={getTemplateName(template)}>
                          {getTemplateName(template)}
                        </h3>
                        <p className="mt-1 text-xs text-gray-500">最近更新 {formatDateTime(template.updated_at || template.created_at)}</p>
                      </div>
                      <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                        光伏
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button variant="secondary" size="sm" icon={<ImagePlus size={14} />} disabled>
                        使用
                      </Button>
                      <Button variant="ghost" size="sm" disabled>
                        设为默认
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={14} />}
                        onClick={() => confirmDelete(template)}
                        loading={deletingId === template.template_id}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-gray-300 bg-white p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-gray-100">
              <LayoutTemplate size={22} className="text-gray-500" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-gray-900">暂无模板</h2>
            <p className="mt-2 text-sm text-gray-500">上传常用版式、光伏业务汇报封面或品牌模板后，可在这里统一管理。</p>
          </div>
        )}
      </div>
    </>
  );
};
