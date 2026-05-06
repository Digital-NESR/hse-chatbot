'use client';

import { useState } from 'react';
import { Menu, Upload } from 'lucide-react';
import IngestionSidebar from '@/components/ingestion/IngestionSidebar';

export default function IngestionLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] w-full bg-white overflow-hidden font-sans text-slate-900">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <IngestionSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative bg-white min-w-0">
        {/* Header */}
        <header className="h-14 md:h-16 px-4 md:px-8 flex items-center justify-between border-b border-gray-50 bg-white/80 backdrop-blur-md sticky top-0 z-10 text-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            {/* Hamburger (mobile) */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <Menu size={20} />
            </button>

            <div className="flex items-center gap-2 bg-nesr-green/5 px-3 py-1 rounded-full border border-nesr-green/10">
              <Upload size={14} className="text-nesr-green" />
              <span className="text-nesr-green font-semibold text-sm">Data Ingestion</span>
            </div>
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
