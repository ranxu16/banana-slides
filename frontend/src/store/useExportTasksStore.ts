import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as api from '@/api/endpoints';
import { devLog } from '@/utils/logger';
import { getT } from '@/utils/i18nHelper';
import { normalizeErrorMessage } from '@/utils';
import type { ProjectOverridesSummary } from '@/types';

const exportI18n = {
  zh: { exportStore: { exportFailed: '导出失败', pollFailed: '轮询失败' } },
  en: { exportStore: { exportFailed: 'Export failed', pollFailed: 'Polling failed' } }
};
const t = getT(exportI18n);

// Note: Backend uses 'RUNNING' but we also accept 'PROCESSING' for compatibility
export type ExportTaskStatus = 'PENDING' | 'PROCESSING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
export type ExportTaskType = 'pptx' | 'pdf' | 'editable-pptx' | 'images' | 'video';

export interface RuntimeSourceSummary {
  capability?: string;
  provider?: string;
  model?: string;
  api_base_url?: string | null;
  credential_fingerprint?: string;
  account_identity?: string | null;
  image_api_protocol?: string;
  resolution?: string;
  source?: {
    provider?: string;
    model?: string;
    credential?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export type ExportConfigSource = RuntimeSourceSummary | Record<string, RuntimeSourceSummary>;

export interface ExportTask {
  id: string;
  taskId: string;
  projectId: string;
  type: ExportTaskType;
  status: ExportTaskStatus;
  pageIds?: string[]; // 选中的页面ID列表，undefined表示全部
  progress?: {
    total: number;
    completed: number;
    percent?: number;
    current_step?: string;
    help_text?: string;
    messages?: string[];
    warnings?: string[];  // 导出警告信息
    warning_details?: {   // 警告详细信息
      style_extraction_failed?: Array<{ element_id: string; reason: string }>;
      text_render_failed?: Array<{ text: string; reason: string }>;
      image_add_failed?: Array<{ path: string; reason: string }>;
      json_parse_failed?: Array<{ context: string; reason: string }>;
      other_warnings?: string[];
      total_warnings?: number;
    };
    download_url?: string;
    filename?: string;
    config_source?: ExportConfigSource;
    project_overrides?: ProjectOverridesSummary;
  };
  configSource?: ExportConfigSource;
  downloadUrl?: string;
  filename?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

const capabilityLabels: Record<string, string> = {
  outline: '大纲',
  description: '描述',
  natural_edit: '自然语言修改',
  image_caption: '图片识别',
  image_generation: '图片生成',
  pptx_generation: 'PPTX 生成',
  editable_pptx_visual: '可编辑 PPTX 结构分析',
  editable_pptx_element: '独立元素生成',
  export_queue: '导出队列',
};

const sourceLabels: Record<string, string> = {
  system_default: '系统默认',
  global: '全局配置',
  personal: '个人配置',
  project_override: '项目覆盖',
  request_override: '本次请求',
};

const isRuntimeSourceSummary = (value: unknown): value is RuntimeSourceSummary => (
  Boolean(value)
  && typeof value === 'object'
  && (
    'capability' in (value as Record<string, unknown>)
    || 'provider' in (value as Record<string, unknown>)
    || 'model' in (value as Record<string, unknown>)
  )
);

const normalizeConfigEntries = (configSource?: ExportConfigSource): Array<[string, RuntimeSourceSummary]> => {
  if (!configSource || typeof configSource !== 'object') return [];
  if (isRuntimeSourceSummary(configSource)) {
    const key = configSource.capability || 'runtime';
    return [[key, configSource]];
  }
  return Object.entries(configSource)
    .filter((entry): entry is [string, RuntimeSourceSummary] => isRuntimeSourceSummary(entry[1]));
};

export const formatConfigSourceSummary = (configSource?: ExportConfigSource): string[] => (
  normalizeConfigEntries(configSource).map(([key, source]) => {
    const capability = capabilityLabels[source.capability || key] || source.capability || key;
    const provider = source.provider || '未指定 Provider';
    const model = source.model || '未指定模型';
    const sourceLayer = sourceLabels[source.source?.model || source.source?.provider || source.source?.credential || ''] || '';
    const suffix = sourceLayer ? ` · ${sourceLayer}` : '';
    return `${capability}: ${provider} / ${model}${suffix}`;
  })
);

export const formatProjectOverrideSummary = (projectOverrides?: ProjectOverridesSummary): string[] => {
  if (!projectOverrides?.fields) return [];
  return Object.values(projectOverrides.fields)
    .filter((field) => field.explicit)
    .map((field) => `${field.label}: ${field.value === true ? '开启' : field.value === false ? '关闭' : field.value ?? '未设置'}`);
};

const pollTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

interface ExportTasksState {
  tasks: ExportTask[];
  
  // Actions
  addTask: (task: Omit<ExportTask, 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<ExportTask>) => void;
  removeTask: (id: string) => void;
  clearCompleted: () => void;
  pollTask: (id: string, projectId: string, taskId: string) => Promise<void>;
  stopTaskPolling: (id: string) => void;
  stopAllPolling: () => void;
  restoreActiveTasks: () => void; // 恢复正在进行的任务并重新开始轮询
}

export const useExportTasksStore = create<ExportTasksState>()(
  persist(
    (set, get) => ({
      tasks: [],

      addTask: (task) => {
        set((state) => {
          // Check if task with this id already exists
          const existingIndex = state.tasks.findIndex(t => t.id === task.id);
          
          if (existingIndex >= 0) {
            // Update existing task
            const updatedTasks = [...state.tasks];
            updatedTasks[existingIndex] = {
              ...updatedTasks[existingIndex],
              ...task,
              // Update completedAt if status changed to completed/failed
              completedAt: (task.status === 'COMPLETED' || task.status === 'FAILED')
                ? new Date().toISOString()
                : updatedTasks[existingIndex].completedAt,
            };
            return { tasks: updatedTasks };
          } else {
            // Add new task
            const newTask: ExportTask = {
              ...task,
              createdAt: new Date().toISOString(),
            };
            return {
              tasks: [newTask, ...state.tasks].slice(0, 20), // Keep max 20 tasks
            };
          }
        });
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updates } : task
          ),
        }));
      },

      removeTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));
      },

      clearCompleted: () => {
        set((state) => ({
          tasks: state.tasks.filter(
            (task) => task.status !== 'COMPLETED' && task.status !== 'FAILED'
          ),
        }));
      },

      pollTask: async (id, projectId, taskId) => {
        const existingTimeout = pollTimeouts.get(id);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
          pollTimeouts.delete(id);
        }

        const poll = async () => {
          try {
            const response = await api.getTaskStatus(projectId, taskId);
            const task = response.data;

            if (!task) {
              console.warn('[ExportTasksStore] No task data in response');
              return;
            }

            const updates: Partial<ExportTask> = {
              status: task.status as ExportTaskStatus,
            };

            if (task.progress) {
              // Parse progress if it's a string (from database JSON field)
              let progressData = task.progress;
              if (typeof progressData === 'string') {
                try {
                  progressData = JSON.parse(progressData);
                } catch (e) {
                  console.warn('[ExportTasksStore] Failed to parse progress:', e);
                }
              }
              
              updates.progress = progressData;
              
              // Extract download URL if available
              if (progressData.download_url) {
                updates.downloadUrl = progressData.download_url;
              }
              if (progressData.filename) {
                updates.filename = progressData.filename;
              }
              if (progressData.config_source) {
                updates.configSource = progressData.config_source;
              }
            }

            if (task.status === 'COMPLETED') {
              pollTimeouts.delete(id);
              updates.completedAt = new Date().toISOString();
              get().updateTask(id, updates);
            } else if (task.status === 'FAILED') {
              pollTimeouts.delete(id);
              const responseError = (task as { error?: string | { message?: string } }).error;
              const taskErrorMessage = task.error_message
                || (typeof responseError === 'string' ? responseError : responseError?.message)
                || t('exportStore.exportFailed');
              updates.errorMessage = normalizeErrorMessage(taskErrorMessage);
              updates.completedAt = new Date().toISOString();
              get().updateTask(id, updates);
            } else if (task.status === 'PENDING' || task.status === 'RUNNING' || task.status === 'PROCESSING') {
              get().updateTask(id, updates);
              const timeout = setTimeout(poll, 2000);
              pollTimeouts.set(id, timeout);
            }
          } catch (error: any) {
            console.error('[ExportTasksStore] Poll error:', error);
            pollTimeouts.delete(id);
            get().updateTask(id, {
              status: 'FAILED',
              errorMessage: normalizeErrorMessage(error.message || t('exportStore.pollFailed')),
              completedAt: new Date().toISOString(),
            });
          }
        };

        await poll();
      },

      stopTaskPolling: (id) => {
        const timeout = pollTimeouts.get(id);
        if (timeout) {
          clearTimeout(timeout);
          pollTimeouts.delete(id);
        }
      },

      stopAllPolling: () => {
        pollTimeouts.forEach((timeout) => clearTimeout(timeout));
        pollTimeouts.clear();
      },

      restoreActiveTasks: () => {
        // 恢复所有正在进行的任务并重新开始轮询
        const state = get();
        const activeTasks = state.tasks.filter(
          task => task.status === 'PENDING' || task.status === 'PROCESSING' || task.status === 'RUNNING'
        );
        
        if (activeTasks.length > 0) {
          devLog(`[ExportTasksStore] 恢复 ${activeTasks.length} 个正在进行的任务`);
          activeTasks.forEach(task => {
            // 重新开始轮询
            state.pollTask(task.id, task.projectId, task.taskId).catch(err => {
              console.error(`[ExportTasksStore] 恢复任务 ${task.id} 失败:`, err);
            });
          });
        }
      },
    }),
    {
      name: 'export-tasks-storage',
      partialize: (state) => ({
        // Persist all tasks (including active ones) so they can be restored after page refresh
        tasks: state.tasks.slice(0, 20), // Keep max 20 tasks
      }),
    }
  )
);
