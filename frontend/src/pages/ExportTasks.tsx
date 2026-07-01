import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileArchive,
  FileText,
  ImageIcon,
  Loader2,
  PlayCircle,
  Search,
  Trash2,
  Video,
  XCircle,
} from 'lucide-react';
import { Button, Input } from '@/components/shared';
import {
  useExportTasksStore,
  type ExportTask,
  type ExportTaskStatus,
  type ExportTaskType,
} from '@/store/useExportTasksStore';
import { cn } from '@/utils';

type StatusFilter = 'all' | 'active' | 'completed' | 'failed';
type FormatFilter = 'all' | ExportTaskType;

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '进行中' },
  { value: 'completed', label: '成功' },
  { value: 'failed', label: '失败' },
];

const formatFilters: Array<{ value: FormatFilter; label: string }> = [
  { value: 'all', label: '全部格式' },
  { value: 'pptx', label: 'PPTX' },
  { value: 'pdf', label: 'PDF' },
  { value: 'editable-pptx', label: '可编辑 PPTX' },
  { value: 'images', label: '图片' },
  { value: 'video', label: '讲解视频' },
];

const taskTypeLabels: Record<ExportTaskType, string> = {
  pptx: 'PPTX',
  pdf: 'PDF',
  'editable-pptx': '可编辑 PPTX',
  images: '图片',
  video: '讲解视频',
};

const statusLabels: Record<ExportTaskStatus, string> = {
  PENDING: '排队中',
  PROCESSING: '处理中',
  RUNNING: '处理中',
  COMPLETED: '成功',
  FAILED: '失败',
};

const isActiveStatus = (status: ExportTaskStatus) => (
  status === 'PENDING' || status === 'PROCESSING' || status === 'RUNNING'
);

const getProgressPercent = (task: ExportTask) => {
  if (!task.progress) return task.status === 'COMPLETED' ? 100 : 0;
  if (typeof task.progress.percent === 'number') return Math.max(0, Math.min(100, task.progress.percent));
  if (task.progress.total > 0) {
    return Math.round((task.progress.completed / task.progress.total) * 100);
  }
  return task.status === 'COMPLETED' ? 100 : 0;
};

const formatDateTime = (isoString?: string) => {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getTaskTitle = (task: ExportTask) => {
  const fileLabel = task.filename || task.progress?.filename;
  if (fileLabel) return fileLabel;
  return `${taskTypeLabels[task.type]} 导出任务`;
};

const getLatestMessage = (task: ExportTask) => {
  const messages = task.progress?.messages || [];
  return messages.length > 0 ? messages[messages.length - 1] : task.progress?.current_step;
};

const TaskIcon: React.FC<{ type: ExportTaskType }> = ({ type }) => {
  if (type === 'pdf') return <FileText size={18} className="text-blue-600" />;
  if (type === 'images') return <ImageIcon size={18} className="text-emerald-600" />;
  if (type === 'video') return <Video size={18} className="text-rose-600" />;
  if (type === 'editable-pptx') return <FileArchive size={18} className="text-amber-600" />;
  return <FileText size={18} className="text-orange-600" />;
};

const StatusPill: React.FC<{ status: ExportTaskStatus }> = ({ status }) => {
  const active = isActiveStatus(status);
  const className = cn(
    'inline-flex h-7 items-center gap-1.5 rounded-md border px-2 text-xs font-semibold',
    active && 'border-amber-200 bg-amber-50 text-amber-700',
    status === 'COMPLETED' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
    status === 'FAILED' && 'border-red-200 bg-red-50 text-red-700'
  );

  return (
    <span className={className}>
      {active ? <Loader2 size={13} className="animate-spin" /> : null}
      {status === 'COMPLETED' ? <CheckCircle2 size={13} /> : null}
      {status === 'FAILED' ? <XCircle size={13} /> : null}
      {statusLabels[status]}
    </span>
  );
};

const downloadTask = (task: ExportTask) => {
  const url = task.downloadUrl || task.progress?.download_url;
  if (!url) return;
  const a = document.createElement('a');
  a.href = url;
  a.download = task.filename || task.progress?.filename || '';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const TaskRow: React.FC<{
  task: ExportTask;
  onRemove: (id: string) => void;
  onRepoll: (task: ExportTask) => void;
}> = ({ task, onRemove, onRepoll }) => {
  const navigate = useNavigate();
  const progress = getProgressPercent(task);
  const latestMessage = getLatestMessage(task);
  const canDownload = task.status === 'COMPLETED' && Boolean(task.downloadUrl || task.progress?.download_url);

  return (
    <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_160px_150px_220px] lg:items-start">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-50">
              <TaskIcon type={task.type} />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-gray-900" title={getTaskTitle(task)}>
                {getTaskTitle(task)}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span>{taskTypeLabels[task.type]}</span>
                <span>任务 ID: {task.taskId || task.id}</span>
                <span>项目 ID: {task.projectId}</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-gray-700">
                {latestMessage || (isActiveStatus(task.status) ? '等待任务进度更新' : '任务已结束')}
              </span>
              <span className="text-gray-500">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  task.status === 'FAILED' ? 'bg-red-500' : 'bg-amber-500'
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {task.status === 'FAILED' && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <div className="mb-1 flex items-center gap-2 font-semibold">
                <AlertCircle size={16} />
                导出失败
              </div>
              <p className="whitespace-pre-wrap break-words">
                {task.errorMessage || latestMessage || '后端未返回失败原因'}
              </p>
              {task.progress?.help_text && (
                <p className="mt-2 border-t border-red-100 pt-2 text-xs text-red-600">
                  {task.progress.help_text}
                </p>
              )}
            </div>
          )}

          {task.progress?.warnings && task.progress.warnings.length > 0 && (
            <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {task.progress.warnings.slice(0, 3).map((warning) => (
                <div key={warning} className="break-words">• {warning}</div>
              ))}
              {task.progress.warnings.length > 3 && <div>还有 {task.progress.warnings.length - 3} 条警告</div>}
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 text-xs font-medium text-gray-500">状态</div>
          <StatusPill status={task.status} />
        </div>

        <div className="text-sm text-gray-600">
          <div className="mb-2 text-xs font-medium text-gray-500">时间</div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-gray-400" />
            {formatDateTime(task.createdAt)}
          </div>
          {task.completedAt && (
            <div className="mt-1 text-xs text-gray-500">完成 {formatDateTime(task.completedAt)}</div>
          )}
        </div>

        <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
          {canDownload && (
            <Button size="sm" icon={<Download size={15} />} onClick={() => downloadTask(task)}>
              下载
            </Button>
          )}
          {task.status === 'FAILED' && (
            <Button size="sm" variant="secondary" icon={<PlayCircle size={15} />} onClick={() => onRepoll(task)}>
              重新检查
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            icon={<Eye size={15} />}
            onClick={() => navigate(`/project/${task.projectId}/preview`)}
          >
            查看项目
          </Button>
          <Button size="sm" variant="ghost" icon={<Trash2 size={15} />} onClick={() => onRemove(task.id)}>
            移除
          </Button>
        </div>
      </div>
    </div>
  );
};

export const ExportTasks: React.FC = () => {
  const {
    tasks,
    clearCompleted,
    removeTask,
    pollTask,
    restoreActiveTasks,
    stopAllPolling,
  } = useExportTasksStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [formatFilter, setFormatFilter] = useState<FormatFilter>('all');

  useEffect(() => {
    restoreActiveTasks();
    return () => stopAllPolling();
  }, [restoreActiveTasks, stopAllPolling]);

  const taskStats = useMemo(() => {
    const active = tasks.filter((task) => isActiveStatus(task.status)).length;
    const completed = tasks.filter((task) => task.status === 'COMPLETED').length;
    const failed = tasks.filter((task) => task.status === 'FAILED').length;
    return { active, completed, failed, total: tasks.length };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesStatus =
        statusFilter === 'all'
        || (statusFilter === 'active' && isActiveStatus(task.status))
        || (statusFilter === 'completed' && task.status === 'COMPLETED')
        || (statusFilter === 'failed' && task.status === 'FAILED');
      const matchesFormat = formatFilter === 'all' || task.type === formatFilter;
      const haystack = [
        getTaskTitle(task),
        task.taskId,
        task.id,
        task.projectId,
        task.errorMessage,
        getLatestMessage(task),
      ].filter(Boolean).join(' ').toLowerCase();
      return matchesStatus && matchesFormat && (!query || haystack.includes(query));
    });
  }, [formatFilter, searchQuery, statusFilter, tasks]);

  const repollTask = (task: ExportTask) => {
    pollTask(task.id, task.projectId, task.taskId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon={<Trash2 size={15} />}
          onClick={clearCompleted}
          disabled={taskStats.completed + taskStats.failed === 0}
        >
          清理历史
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-md border border-gray-200 bg-white p-4">
          <div className="text-xs font-medium text-gray-500">全部任务</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900">{taskStats.total}</div>
        </div>
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
          <div className="text-xs font-medium text-amber-700">进行中</div>
          <div className="mt-2 text-2xl font-semibold text-amber-800">{taskStats.active}</div>
        </div>
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-xs font-medium text-emerald-700">成功</div>
          <div className="mt-2 text-2xl font-semibold text-emerald-800">{taskStats.completed}</div>
        </div>
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <div className="text-xs font-medium text-red-700">失败</div>
          <div className="mt-2 text-2xl font-semibold text-red-800">{taskStats.failed}</div>
        </div>
      </div>

      <div className="rounded-md border border-gray-200 bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_220px_220px]">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-3 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜索任务、项目 ID、失败原因"
              className="pl-10"
              aria-label="搜索导出任务"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
            aria-label="状态筛选"
          >
            {statusFilters.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select
            value={formatFilter}
            onChange={(event) => setFormatFilter(event.target.value as FormatFilter)}
            className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
            aria-label="格式筛选"
          >
            {formatFilters.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredTasks.length > 0 ? (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskRow key={task.id} task={task} onRemove={removeTask} onRepoll={repollTask} />
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-gray-300 bg-white p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-gray-100">
            <FileText size={22} className="text-gray-500" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-gray-900">暂无导出任务</h2>
          <p className="mt-2 text-sm text-gray-500">
            在项目预览页导出 PPTX、PDF、可编辑 PPTX、图片或讲解视频后，任务会出现在这里。
          </p>
        </div>
      )}
    </div>
  );
};
