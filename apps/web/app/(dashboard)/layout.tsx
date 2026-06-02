'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tag,
  Target,
  LogOut,
  TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transações', icon: ArrowLeftRight },
  { href: '/categories', label: 'Categorias', icon: Tag },
  { href: '/goals', label: 'Metas', icon: Target },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth, accessToken } = useAuthStore();

  useEffect(() => {
    if (!accessToken) router.replace('/login');
  }, [accessToken, router]);

  if (!accessToken) return null;

  function handleLogout() {
    clearAuth();
    router.push('/login');
  }

  return (
    <div className="flex min-h-screen bg-[#F8F7F4]">
      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-56 bg-[#0C0C0C] z-30">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp size={13} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-semibold text-[13px] tracking-tight">
              Finance App
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-4 space-y-0.5">
          <p className="px-3 pb-2 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
            Menu
          </p>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors duration-150 cursor-pointer group
                  ${active
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
              >
                <Icon size={15} strokeWidth={active ? 2.5 : 2} />
                {label}
                {active && (
                  <div className="ml-auto w-1 h-3.5 bg-blue-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-2.5 py-4 border-t border-zinc-800/80">
          <div className="px-3 py-2 mb-1">
            <p className="text-[11px] text-zinc-600 truncate">{user?.email}</p>
            <p className="text-[13px] text-zinc-300 font-medium truncate mt-0.5">
              {user?.name ?? 'Usuário'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[13px] font-medium text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors duration-150 cursor-pointer"
          >
            <LogOut size={15} />
            Sair
          </button>
        </div>
      </aside>

      {/* ── Mobile header ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3.5 bg-[#0C0C0C] border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
            <TrendingUp size={12} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-white font-semibold text-sm">Finance App</span>
        </div>
        <button
          onClick={handleLogout}
          className="text-zinc-500 hover:text-zinc-200 transition-colors duration-150 cursor-pointer p-1"
          aria-label="Sair"
        >
          <LogOut size={17} />
        </button>
      </header>

      {/* ── Main content ── */}
      <div className="lg:pl-56 flex-1 flex flex-col">
        <main className="flex-1 px-4 pt-20 pb-8 lg:px-8 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}
