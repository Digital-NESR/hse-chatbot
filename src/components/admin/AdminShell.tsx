'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Upload, BarChart2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AdminSidebar from './AdminSidebar';

const PAGE_META: Record<string, { label: string; Icon: LucideIcon }> = {
  '/admin/ingestion': { label: 'Data Ingestion', Icon: Upload },
  '/admin/analytics': { label: 'Analytics',      Icon: BarChart2 },
};

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Hydrate collapse state from localStorage after mount
  useEffect(() => {
    const saved = localStorage.getItem('admin_sidebar_collapsed');
    if (saved === 'true') setIsCollapsed(true);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Derive current page label + icon from pathname
  const currentPage =
    Object.entries(PAGE_META).find(([path]) => pathname.startsWith(path))?.[1] ?? null;

  return (
    <div className="flex h-[100dvh] w-full bg-white overflow-hidden font-sans text-slate-900">
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <AdminSidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
        onToggleCollapse={toggleCollapse}
      />

      <main className="flex-1 flex flex-col h-full relative bg-white min-w-0">
        {/* Shared header */}
        <header className="h-14 md:h-16 px-4 md:px-8 flex items-center justify-between border-b border-gray-50 bg-white/80 backdrop-blur-md sticky top-0 z-10 text-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>

            {/* Page badge */}
            {currentPage && (
              <div className="flex items-center gap-2 bg-nesr-green/5 px-3 py-1 rounded-full border border-nesr-green/10">
                <currentPage.Icon size={14} className="text-nesr-green" />
                <span className="text-nesr-green font-semibold text-sm">
                  {currentPage.label}
                </span>
              </div>
            )}
          </div>

          <span className="hidden sm:inline text-xs text-gray-400 font-medium tracking-wide">
            NESR Internal Tool
          </span>
        </header>

        {/* Scrollable page content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 scroll-smooth">
          {children}
        </div>
      </main>
    </div>
  );
}
