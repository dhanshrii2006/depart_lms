import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { 
  Home, 
  BookOpen, 
  Users,
  Settings,
  LogOut,
  User,
  Calendar,
  Bell,
  MoreHorizontal
} from 'lucide-react';
import { useAuthStore } from '../store/index.js';
import { useLogout } from '../hooks/index.js';

const SidebarLink = ({ to, icon: Icon, label, active }) => (
  <Link
    to={to}
    className={clsx(
      'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200',
      active
        ? 'bg-indigo-100 text-indigo-700 font-medium'
        : 'text-gray-700 hover:bg-gray-100'
    )}
  >
    <Icon className="w-5 h-5" />
    <span>{label}</span>
  </Link>
);

export const Sidebar = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const { mutate: logout } = useLogout();

  if (!user) return null;

  const getMenuItems = () => {
    switch (user.role) {
      case 'admin':
        return [
          { to: '/admin/dashboard', icon: Home, label: 'Dashboard' },
          { to: '/admin/users', icon: Users, label: 'Users' },
          { to: '/admin/roll-numbers', icon: Settings, label: 'Roll Numbers' },
        ];
      case 'teacher':
        return [
          { to: '/teacher/dashboard', icon: Home, label: 'Dashboard' },
          { to: '/teacher/calendar', icon: Calendar, label: 'Calendar' },
        ];
      case 'student':
        return [
          { to: '/student/dashboard', icon: Home, label: 'Dashboard' },
          { to: '/student/calendar', icon: Calendar, label: 'Calendar' },
          { to: '/student/todo', icon: BookOpen, label: 'To-Do' },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col fixed left-0 top-0">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-indigo-600">SVPCET</h1>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
        {menuItems.map((item) => (
          <SidebarLink
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
            active={location.pathname.startsWith(item.to)}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <Link
          to="/profile"
          className={clsx(
            'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200',
            location.pathname === '/profile'
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-700 hover:bg-gray-100'
          )}
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </Link>
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export const Layout = ({ children }) => {
  const { user } = useAuthStore();

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 ml-64 bg-gray-50 min-h-screen">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
