import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, User, Users } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export function UserMenu({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const switchAccount = () => {
    logout();
    setOpen(false);
    navigate('/');
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm text-gray-700 dark:text-foreground-secondary hover:bg-banana-100/60 dark:hover:bg-background-hover transition-colors"
        title={user?.username ? `当前用户：${user.username}` : '当前用户'}
      >
        <span className="w-7 h-7 rounded-full bg-gradient-to-br from-banana-400 to-orange-500 text-white flex items-center justify-center text-xs font-semibold">
          {user?.username?.slice(0, 1).toUpperCase() || <User size={14} />}
        </span>
        {!compact && (
          <span className="hidden md:flex flex-col items-start leading-tight">
            <span className="font-medium max-w-[120px] truncate">{user?.username || '未登录'}</span>
            <span className="text-[11px] text-gray-500 dark:text-foreground-tertiary">
              {user?.is_admin ? '管理员' : '普通用户'}
            </span>
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-lg border border-gray-200 dark:border-border-primary bg-white dark:bg-background-secondary shadow-lg dark:shadow-background-primary/40 py-1">
          <div className="px-3 py-2 border-b border-gray-100 dark:border-border-primary">
            <div className="text-sm font-semibold text-gray-900 dark:text-foreground-primary truncate">{user?.username}</div>
            <div className="text-xs text-gray-500 dark:text-foreground-tertiary truncate">{user?.email || (user?.is_admin ? '管理员账号' : '普通账号')}</div>
          </div>

          {user?.is_admin && (
            <>
              <MenuItem icon={<Users size={15} />} label="用户管理" onClick={() => { setOpen(false); navigate('/admin'); }} />
              <MenuItem icon={<Settings size={15} />} label="系统设置" onClick={() => { setOpen(false); navigate('/settings'); }} />
            </>
          )}
          <div className="my-1 h-px bg-gray-100 dark:bg-border-primary" />
          <MenuItem icon={<LogOut size={15} />} label="退出 / 切换账号" onClick={switchAccount} danger />
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger = false,
  disabled = false,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
        disabled
          ? 'text-gray-300 dark:text-foreground-tertiary cursor-not-allowed'
          : danger
            ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20'
            : 'text-gray-700 dark:text-foreground-secondary hover:bg-gray-50 dark:hover:bg-background-hover'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
