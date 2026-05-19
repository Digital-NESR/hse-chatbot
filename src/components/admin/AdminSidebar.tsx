'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Upload, BarChart2, LogOut, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { siteConfig } from '@/config/site';

interface AdminSidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onMobileClose: () => void;
  onToggleCollapse: () => void;
}

const navItems = [
  { label: 'Data Ingestion', href: '/admin/ingestion', icon: Upload },
  { label: 'Analytics',      href: '/admin/analytics', icon: BarChart2 },
];

export default function AdminSidebar({
  isCollapsed,
  isMobileOpen,
  onMobileClose,
  onToggleCollapse,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { images, text, colors } = siteConfig;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 bg-gray-50 border-r border-gray-100 flex-shrink-0 flex flex-col h-full transform transition-all duration-200 ease-in-out md:relative md:translate-x-0 ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      } ${isCollapsed ? 'w-[72px]' : 'w-[280px]'}`}
    >
      {/* ── Branding Header ── */}
      <div
        className={`p-4 flex items-center shrink-0 ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        <div className={`flex items-center ${isCollapsed ? '' : 'gap-3 min-w-0'}`}>
          <div className="relative h-8 w-8 rounded-full overflow-hidden shadow-sm ring-1 ring-gray-200 shrink-0">
            <Image src={images.logo} alt={text.appName} fill className="object-cover" />
          </div>
          {!isCollapsed && (
            <h1 className="text-sm font-bold text-gray-900 tracking-tight leading-tight truncate">
              {text.sidebarTitle}
            </h1>
          )}
        </div>

        {/* Desktop collapse / Mobile close */}
        {!isCollapsed && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onToggleCollapse}
              className="hidden md:flex p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={onMobileClose}
              className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Close sidebar"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Collapsed → expand button (desktop only) */}
      {isCollapsed && (
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex mx-auto mb-1 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Expand sidebar"
        >
          <ChevronRight size={16} />
        </button>
      )}

      {/* ── Nav Items ── */}
      <nav
        className={`flex-1 ${isCollapsed ? 'px-2' : 'px-4'} pt-4 border-t border-gray-100 space-y-1`}
      >
        {!isCollapsed && (
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
            Navigation
          </div>
        )}

        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={onMobileClose}
              title={isCollapsed ? label : undefined}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center' : 'gap-3'
              } px-3 py-3 rounded-lg transition-all text-sm font-medium relative group ${
                isActive
                  ? 'bg-nesr-green/10 text-gray-900 shadow-sm ring-1 ring-black/5'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {isActive && !isCollapsed && (
                <div className="absolute left-0 top-1 bottom-1 w-1 bg-nesr-green rounded-r-md" />
              )}
              <Icon
                size={16}
                className={
                  isActive
                    ? 'text-nesr-green'
                    : 'text-gray-400 group-hover:text-gray-600'
                }
              />
              {!isCollapsed && (
                <span className={isActive ? 'font-semibold text-nesr-green' : ''}>
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── User Info + Sign Out ── */}
      <div
        className={`${isCollapsed ? 'p-2' : 'p-4'} border-t border-gray-100 bg-gray-50/50`}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg mb-1">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || text.defaultUserName}
                referrerPolicy="no-referrer"
                className="h-8 w-8 rounded-full ring-2 ring-white object-cover shrink-0"
              />
            ) : (
              <div
                className="h-8 w-8 rounded-full ring-2 ring-white flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ backgroundColor: colors.fallbackAvatarBg }}
              >
                {(session?.user?.name || 'U')
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}
            <div className="text-sm flex-1 min-w-0">
              <p className="font-medium text-gray-700 truncate">
                {session?.user?.name || text.defaultUserName}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {(session?.user as any)?.jobTitle || text.defaultJobTitle}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          title={isCollapsed ? text.signOutButton : undefined}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center' : 'gap-2.5'
          } px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-150 group`}
        >
          <LogOut
            size={15}
            className="transition-colors group-hover:text-red-500 shrink-0"
          />
          {!isCollapsed && (
            <span className="font-medium">{text.signOutButton}</span>
          )}
        </button>
      </div>
    </aside>
  );
}
