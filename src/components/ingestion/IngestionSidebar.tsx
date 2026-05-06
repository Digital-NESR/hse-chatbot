'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Upload, BarChart2, LogOut, X } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { siteConfig } from '@/config/site';

interface IngestionSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { label: 'Data Ingestion', href: '/ingestion', icon: Upload },
  { label: 'Analytics', href: '/admin', icon: BarChart2 },
];

export default function IngestionSidebar({ isOpen, onClose }: IngestionSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { images, text, colors } = siteConfig;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-gray-50 border-r border-gray-100 flex-shrink-0 flex flex-col h-full transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Branding Header */}
      <div className="p-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 rounded-full overflow-hidden shadow-sm ring-1 ring-gray-200">
            <Image src={images.logo} alt={text.appName} fill className="object-cover" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">{text.sidebarTitle}</h1>
        </div>
        {/* Mobile Close */}
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-4 pt-4 border-t border-gray-100 space-y-1">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
          Navigation
        </div>
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all text-sm font-medium relative group ${
                isActive
                  ? 'bg-nesr-green/10 text-gray-900 shadow-sm ring-1 ring-black/5'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1 bottom-1 w-1 bg-nesr-green rounded-r-md" />
              )}
              <Icon
                size={16}
                className={isActive ? 'text-nesr-green' : 'text-gray-400 group-hover:text-gray-600'}
              />
              <span className={isActive ? 'font-semibold text-nesr-green' : ''}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info + Sign Out */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg mb-1">
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || text.defaultUserName}
              referrerPolicy="no-referrer"
              className="h-8 w-8 rounded-full ring-2 ring-white object-cover"
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
              {session?.user?.jobTitle || text.defaultJobTitle}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-150 group"
        >
          <LogOut size={15} className="transition-colors group-hover:text-red-500" />
          <span className="font-medium">{text.signOutButton}</span>
        </button>
      </div>
    </aside>
  );
}
