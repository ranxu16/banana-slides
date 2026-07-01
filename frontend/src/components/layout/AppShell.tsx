import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  History,
  LayoutDashboard,
  Library,
  Search,
  Settings,
  ShieldCheck,
  UploadCloud,
  Users,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { UserMenu } from '@/components/shared/UserMenu';
import { BrandLogo } from './BrandLogo';

interface AppShellProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
}

interface ShellNavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const navItems: ShellNavItem[] = [
  { to: '/', label: '工作台', icon: LayoutDashboard },
  { to: '/history', label: '我的项目', icon: History },
  { to: '/templates', label: '模板中心', icon: FolderOpen },
  { to: '/materials', label: '素材中心', icon: Library },
  { to: '/exports', label: '导出任务', icon: UploadCloud },
];

const adminItems: ShellNavItem[] = [
  { to: '/admin', label: '用户管理', icon: Users },
  { to: '/settings', label: '全局配置', icon: Settings },
];

export function AppShell({ children, title, description, actions }: AppShellProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const visibleAdminItems = user?.is_admin ? adminItems : [];

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-gray-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[220px] border-r border-gray-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b border-gray-100 px-5">
          <BrandLogo />
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {[...navItems, ...visibleAdminItems].map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-amber-50 text-amber-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  ].join(' ')
                }
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-gray-100 p-3">
          <div className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-500">
            <ShieldCheck size={15} className="text-amber-600" />
            <span>{user?.is_admin ? '管理员工作区' : '个人工作区'}</span>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[220px]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white/95 px-4 backdrop-blur lg:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              className="lg:hidden"
              onClick={() => navigate('/')}
              aria-label="返回工作台"
            >
              <BrandLogo compact />
            </button>
            <div className="hidden h-9 w-[320px] items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-400 md:flex">
              <Search size={16} />
              <span>搜索项目、模板、配置</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-md border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 sm:block">
              服务正常
            </div>
            <UserMenu />
          </div>
        </header>

        <main className="px-4 py-6 lg:px-6">
          {(title || description || actions) && (
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                {title && <h1 className="text-[22px] font-semibold leading-tight text-gray-900">{title}</h1>}
                {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
              </div>
              {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
