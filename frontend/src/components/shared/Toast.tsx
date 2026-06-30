import React, { useEffect, useRef } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/utils';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  onClose,
  duration = type === 'error' ? 5000 : 3000,
}) => {
  // 用 ref 持有最新的 onClose，避免 onClose 每次 re-render 变引用导致 timer 被反复重置
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onCloseRef.current(), duration);
      return () => clearTimeout(timer);
    }
  }, [duration]); // 只依赖 duration，不依赖 onClose

  const icons = {
    success: <CheckCircle size={20} />,
    error: <AlertCircle size={20} />,
    info: <Info size={20} />,
    warning: <AlertTriangle size={20} />,
  };

  const styles = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-gray-900 dark:bg-background-hover text-white',
    warning: 'bg-amber-500 text-white',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg',
        'animate-in slide-in-from-right transition-all duration-300',
        styles[type]
      )}
    >
      {icons[type]}
      <span className="flex-1">{message}</span>
      <button
        onClick={onClose}
        className="hover:opacity-75 transition-opacity"
      >
        <X size={18} />
      </button>
    </div>
  );
};

type ToastItem = { id: string; props: Omit<ToastProps, 'onClose'> };

// 稳定的具名组件 —— 定义在 hook 外部，React 不会因引用变化而卸载重挂
export const ToastContainer: React.FC<{ toasts: ToastItem[]; onRemove: (id: string) => void }> = ({
  toasts,
  onRemove,
}) => (
  <div className="fixed top-20 right-4 z-50 flex flex-col items-end gap-2 pointer-events-none">
    {toasts.map((toast) => (
      <div key={toast.id} className="pointer-events-auto">
        <Toast
          {...toast.props}
          onClose={() => onRemove(toast.id)}
        />
      </div>
    ))}
  </div>
);

// Toast 管理器
export const useToast = () => {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const show = React.useCallback((props: Omit<ToastProps, 'onClose'>) => {
    const id = Math.random().toString(36);
    setToasts((prev) => {
      const newToasts = [...prev, { id, props }];
      // 最多保留5个toast，超过则移除最早的
      return newToasts.length > 5 ? newToasts.slice(-5) : newToasts;
    });
  }, []);

  const remove = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { show, toasts, remove };
};
