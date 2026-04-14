import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid,
  BookOpen,
  ClipboardList,
  Calendar,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import { useAuthStore } from '../../store/index.js';
import { useLogout } from '../../hooks/index.js';

const NAV_ITEMS = [
  { id: 'dashboard', icon: LayoutGrid, label: 'Dashboard', href: '/dashboard', roles: ['student', 'teacher', 'admin'] },
  { id: 'student-classes', icon: BookOpen, label: 'My Classes', href: '/student/dashboard', roles: ['student'] },
  { id: 'teacher-classes', icon: BookOpen, label: 'My Classes', href: '/teacher/dashboard', roles: ['teacher'] },
  { id: 'student-transcript', icon: BarChart3, label: 'Grades', href: '/student/transcript', roles: ['student'] },
  { id: 'calendar', icon: Calendar, label: 'Calendar', href: '/calendar', roles: ['student', 'teacher'] },
  { id: 'settings', icon: Settings, label: 'Settings', href: '/settings', roles: ['student', 'teacher', 'admin'] },
];

/**
 * Sidebar component - navigation menu with role-based items
 * Premium SaaS design with smooth animations
 */
const Sidebar = ({ isMobile = false, isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { mutate: logout } = useLogout();

  const userRole = user?.role || 'student';
  const filteredItems = NAV_ITEMS.filter(item => item.roles.includes(userRole));

  const content = (
    <>
      {/* Logo & Branding */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-12 h-12 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0 overflow-hidden"
          >
            <img src="/logo.jpeg" alt="SVPCET Logo" className="w-full h-full object-cover" />
          </motion.div>
          <div>
            <h1 className="text-lg font-semibold text-white font-cabinet-grotesk">SVPCET</h1>
            <p className="text-xs text-gray-300">Rise & Shine</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-transparent">
        {filteredItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.href);

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link
                to={item.href}
                onClick={isMobile ? onClose : undefined}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-250 group relative ${
                  isActive
                    ? 'bg-[#7C5CFC] text-white shadow-lg'
                    : 'text-white hover:text-white hover:bg-gray-700'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#7C5CFC] rounded-r-lg"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* User Card */}
      <div className="p-4 border-t border-gray-700">
        <motion.div
          whileHover={{ backgroundColor: 'rgba(124, 92, 252, 0.15)' }}
          className="rounded-lg bg-[#7C5CFC]/10 backdrop-blur-sm p-3 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3 mb-3">
            <Avatar name={user?.name} size="sm" />
            <div className="min-w-0">
              <p className="font-medium text-white text-sm truncate font-inter">{user?.name}</p>
              <p className="text-xs text-gray-300 capitalize">{user?.role}</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-red-900/40 hover:bg-red-900/60 text-red-200 transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </motion.button>
        </motion.div>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 z-40"
            />
          )}
        </AnimatePresence>

        {/* Mobile Sidebar */}
        <motion.div
          initial={{ x: -280 }}
          animate={{ x: isOpen ? 0 : -280 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed left-0 top-0 bottom-0 w-72 bg-gradient-to-b from-[#18162A] to-[#1F1D30] z-50 flex flex-col shadow-2xl"
        >
          {content}
        </motion.div>
      </>
    );
  }

  return (
    <div className="fixed left-0 top-0 bottom-0 w-60 bg-gradient-to-b from-[#18162A] to-[#1F1D30] flex flex-col hidden md:flex shadow-xl">
      {content}
    </div>
  );
};

Sidebar.displayName = 'Sidebar';

export default Sidebar;
export { Sidebar };
