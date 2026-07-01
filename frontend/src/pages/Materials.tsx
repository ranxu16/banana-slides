import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, FileImage, RefreshCw, Search, Trash2, UploadCloud } from 'lucide-react';
import { Button, Input, Loading, ToastContainer, useConfirm, useToast } from '@/components/shared';
import * as api from '@/api/endpoints';
import type { Material } from '@/types';

type ScopeFilter = 'all' | 'global' | 'project';
type TypeFilter = 'all' | 'image' | 'icon' | 'chart';

const getMaterialName = (material: Material) => (
  material.name || material.original_filename || material.source_filename || material.filename || `素材 ${material.id.slice(0, 8)}`
);

const getMaterialScope = (material: Material) => (
  material.project_id ? '项目素材' : '全局素材'
);

const inferMaterialType = (material: Material): TypeFilter => {
  const name = getMaterialName(material).toLowerCase();
  const caption = (material.caption || '').toLowerCase();
  if (name.includes('icon') || name.includes('logo') || caption.includes('图标') || caption.includes('logo')) return 'icon';
  if (name.includes('chart') || name.includes('graph') || caption.includes('图表')) return 'chart';
  return 'image';
};

const formatDateTime = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const Materials: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { show, toasts, remove } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const loadMaterials = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.listMaterials('all');
      setMaterials(response.data?.materials || []);
    } catch (err: any) {
      const message = err?.response?.data?.error?.message || err?.message || '加载素材失败';
      setError(message);
      show({ message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const filteredMaterials = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return materials.filter((material) => {
      const materialType = inferMaterialType(material);
      const matchesType = typeFilter === 'all' || materialType === typeFilter;
      const matchesScope =
        scopeFilter === 'all'
        || (scopeFilter === 'global' && !material.project_id)
        || (scopeFilter === 'project' && Boolean(material.project_id));
      const haystack = [
        getMaterialName(material),
        material.caption,
        material.prompt,
        material.filename,
        material.project_id,
      ].filter(Boolean).join(' ').toLowerCase();
      return matchesType && matchesScope && (!keyword || haystack.includes(keyword));
    });
  }, [materials, query, scopeFilter, typeFilter]);

  const globalCount = materials.filter((material) => !material.project_id).length;
  const projectCount = materials.length - globalCount;

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      await api.uploadMaterial(file, null, true);
      show({ message: '素材已上传', type: 'success' });
      await loadMaterials();
    } catch (err: any) {
      show({ message: err?.response?.data?.error?.message || err?.message || '上传素材失败', type: 'error' });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const deleteMaterial = async (material: Material) => {
    setDeletingId(material.id);
    try {
      await api.deleteMaterial(material.id);
      setMaterials((prev) => prev.filter((item) => item.id !== material.id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(material.id);
        return next;
      });
      show({ message: '素材已删除', type: 'success' });
    } catch (err: any) {
      show({ message: err?.response?.data?.error?.message || err?.message || '删除素材失败', type: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDelete = (material: Material) => {
    confirm(
      `确定删除「${getMaterialName(material)}」吗？此操作不可恢复。`,
      () => deleteMaterial(material),
      { title: '删除素材', confirmText: '删除', cancelText: '取消', variant: 'danger' }
    );
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const downloadSelected = async () => {
    if (selectedIds.size === 0) return;
    try {
      await api.downloadMaterialsZip([...selectedIds]);
      show({ message: '正在下载素材包', type: 'success' });
    } catch (err: any) {
      show({ message: err?.response?.data?.error?.message || err?.message || '下载素材失败', type: 'error' });
    }
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
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <div className="text-xs font-medium text-gray-500">素材总数</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{materials.length}</div>
          </div>
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <div className="text-xs font-medium text-gray-500">全局素材</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{globalCount}</div>
          </div>
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <div className="text-xs font-medium text-gray-500">项目素材</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{projectCount}</div>
          </div>
          <div className="rounded-md border border-gray-200 bg-white p-4">
            <div className="text-xs font-medium text-gray-500">已选择</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{selectedIds.size}</div>
          </div>
        </div>

        <div className="rounded-md border border-gray-200 bg-white p-4">
          <div className="grid gap-3 xl:grid-cols-[minmax(240px,1fr)_180px_180px_auto_auto_auto]">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-3 text-gray-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索素材名称、说明或项目 ID"
                className="pl-10"
                aria-label="搜索素材"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
              aria-label="类型筛选"
            >
              <option value="all">全部类型</option>
              <option value="image">图片</option>
              <option value="icon">图标/Logo</option>
              <option value="chart">图表素材</option>
            </select>
            <select
              value={scopeFilter}
              onChange={(event) => setScopeFilter(event.target.value as ScopeFilter)}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
              aria-label="可见范围筛选"
            >
              <option value="all">全部范围</option>
              <option value="global">全局素材</option>
              <option value="project">项目素材</option>
            </select>
            <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={loadMaterials} disabled={isLoading}>
              刷新
            </Button>
            <Button
              variant="secondary"
              icon={<Download size={16} />}
              onClick={downloadSelected}
              disabled={selectedIds.size === 0}
            >
              下载
            </Button>
            <Button icon={<UploadCloud size={16} />} onClick={() => fileInputRef.current?.click()} loading={isUploading}>
              上传素材
            </Button>
          </div>
          {error && <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        </div>

        {isLoading ? (
          <div className="rounded-md border border-gray-200 bg-white py-14">
            <Loading message="正在加载素材" />
          </div>
        ) : filteredMaterials.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {filteredMaterials.map((material) => {
              const materialType = inferMaterialType(material);
              const isSelected = selectedIds.has(material.id);
              return (
                <div key={material.id} className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => toggleSelected(material.id)}
                    className="block aspect-[4/3] w-full bg-gray-100 text-left"
                    aria-label={`选择素材 ${getMaterialName(material)}`}
                  >
                    {material.url ? (
                      <img
                        src={material.url}
                        alt={getMaterialName(material)}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        <FileImage size={28} />
                      </div>
                    )}
                  </button>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-gray-900" title={getMaterialName(material)}>
                          {getMaterialName(material)}
                        </h3>
                        <p className="mt-1 text-xs text-gray-500">更新 {formatDateTime(material.updated_at || material.created_at)}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelected(material.id)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        aria-label={`选择 ${getMaterialName(material)}`}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 font-medium text-gray-600">
                        {materialType === 'icon' ? '图标/Logo' : materialType === 'chart' ? '图表素材' : '图片'}
                      </span>
                      <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 font-medium text-blue-700">
                        {getMaterialScope(material)}
                      </span>
                    </div>
                    {material.caption && (
                      <p className="mt-3 line-clamp-2 text-xs leading-5 text-gray-500" title={material.caption}>
                        {material.caption}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button variant="secondary" size="sm" disabled>
                        使用
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={14} />}
                        onClick={() => confirmDelete(material)}
                        loading={deletingId === material.id}
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
              <FileImage size={22} className="text-gray-500" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-gray-900">暂无素材</h2>
            <p className="mt-2 text-sm text-gray-500">上传产品图、逆变器图、项目现场图、品牌图标或常用图表素材后，可在这里统一管理。</p>
          </div>
        )}
      </div>
    </>
  );
};
