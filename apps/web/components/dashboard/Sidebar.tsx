'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Target, CheckSquare, BarChart2,
  Settings, Brain, ChevronLeft, ChevronRight,
  LogOut, Menu, X
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Goals',     href: '/goals',     icon: <Target size={18} /> },
  { label: 'Tasks',     href: '/tasks',     icon: <CheckSquare size={18} /> },
  { label: 'Insights',  href: '/insights',  icon: <Brain size={18} /> },
  { label: 'Settings',  href: '/settings',  icon: <Settings size={18} /> },
];

interface SidebarProps {
  userDisplayName?: string | null;
  userEmail?: string | null;
}

export function Sidebar({ userDisplayName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const safeName = (userDisplayName || (userEmail ? userEmail.split('@')[0] : 'User') || 'User').trim();
  const safeEmail = userEmail || '';
  const initials = (safeName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)) || 'U';

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div
        className="flex items-center gap-3 px-4 py-5"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" fill="white" opacity="0.9"/>
            <circle cx="12" cy="12" r="7" stroke="white" strokeWidth="1.5" opacity="0.5"/>
            <circle cx="12" cy="12" r="11" stroke="white" strokeWidth="1" opacity="0.25"/>
            <circle cx="19" cy="12" r="1.5" fill="white" opacity="0.8"/>
          </svg>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="font-bold text-base overflow-hidden whitespace-nowrap"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              SAAR
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              style={{ textDecoration: 'none' }}
            >
              <motion.div
                className="sidebar-item"
                style={isActive ? {
                  background: 'var(--accent-subtle)',
                  color: 'var(--accent)',
                  fontWeight: 600,
                } : {}}
                whileHover={{ x: 2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="overflow-hidden whitespace-nowrap text-sm"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--accent)', flexShrink: 0 }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom: User + Logout */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid var(--border)' }}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-2 py-2 mb-2 rounded-xl'}`}>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
          >
            {initials}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden min-w-0"
              >
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {safeName}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                  {safeEmail}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="sidebar-item w-full text-left"
            style={{ color: 'var(--text-secondary)' }}
          >
            <LogOut size={16} />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-sm overflow-hidden whitespace-nowrap"
                >
                  Sign out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </form>
      </div>

      {/* Collapse toggle — desktop only */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex absolute -right-3.5 top-20 w-7 h-7 items-center justify-center rounded-full border"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          boxShadow: 'var(--shadow-sm)',
          cursor: 'pointer',
        }}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        className="hidden lg:flex flex-col h-screen sticky top-0 flex-shrink-0 relative"
        animate={{ width: collapsed ? 72 : 224 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        {navContent}
      </motion.aside>

      {/* Mobile top bar */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 py-3.5"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" fill="white" opacity="0.9"/>
              <circle cx="12" cy="12" r="7" stroke="white" strokeWidth="1.5" opacity="0.5"/>
              <circle cx="19" cy="12" r="1.5" fill="white" opacity="0.8"/>
            </svg>
          </div>
          <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>SAAR</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl"
          style={{ border: '1px solid var(--border)' }}
          aria-label="Open menu"
        >
          <Menu size={18} style={{ color: 'var(--text-primary)' }} />
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50"
              style={{ background: 'rgba(11,16,32,0.4)', backdropFilter: 'blur(4px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className="fixed top-0 left-0 h-full z-50 w-64 flex flex-col"
              style={{ background: 'var(--surface)' }}
              initial={{ x: -264 }}
              animate={{ x: 0 }}
              exit={{ x: -264 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="flex justify-end p-4">
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded-xl" style={{ border: '1px solid var(--border)' }}>
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">{navContent}</div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
