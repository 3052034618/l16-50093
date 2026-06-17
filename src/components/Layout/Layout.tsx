import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Package,
  Layers,
  TrendingUp,
  AlertTriangle,
  Eye,
  Menu,
  X,
  Warehouse,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    path: '/',
    label: '商品管理',
    icon: Package,
  },
  {
    path: '/inventory/flow',
    label: '库存流水',
    icon: TrendingUp,
  },
  {
    path: '/inventory/warning',
    label: '库存预警',
    icon: AlertTriangle,
  },
  {
    path: '/product/preview',
    label: '前台预览',
    icon: Eye,
  },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-gradient-to-b from-blue-900 to-blue-800 text-white transition-all duration-300 ease-in-out',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-blue-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur">
              <Warehouse className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight">
                  SKU管理系统
                </span>
                <span className="text-xs text-blue-300">电商商品管理</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                  isActive
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 flex-shrink-0 transition-transform',
                    isActive ? 'scale-110' : 'group-hover:scale-105'
                  )}
                />
                {sidebarOpen && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-blue-700/50">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-sm font-bold">
                管
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">管理员</span>
                <span className="text-xs text-blue-300">商品管理员</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-sm font-bold">
                管
              </div>
            </div>
          )}
        </div>
      </aside>

      <div
        className={cn(
          'flex-1 flex flex-col min-h-screen transition-all duration-300',
          sidebarOpen ? 'ml-64' : 'ml-20'
        )}
      >
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">
              {navItems.find(
                (item) =>
                  item.path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.path)
              )?.label || ''}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
                <AlertTriangle className="w-5 h-5 text-gray-500" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <div className="animate-fadeIn">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
