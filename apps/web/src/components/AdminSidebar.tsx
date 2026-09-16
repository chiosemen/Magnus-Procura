'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ShieldAlert, 
  BarChart3, 
  DollarSign, 
  Users, 
  Layers, 
  ScrollText, 
  LogOut,
  Sparkles,
  Sliders
} from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: 'Executive Overview', icon: BarChart3 },
    { href: '/admin/economics', label: 'Unit Economics (P&L)', icon: DollarSign },
    { href: '/admin/cohorts', label: 'Cohort Governance', icon: Layers },
    { href: '/admin/operators', label: 'Operator Capacity', icon: Users },
    { href: '/admin/audit', label: 'Audit Log Stream', icon: ScrollText },
  ];

  return (
    <aside className="w-64 bg-slate-950 text-white min-h-screen fixed left-0 top-0 flex flex-col border-r border-slate-800/80 z-30">
      {/* Brand & Admin Badge */}
      <div className="p-6 border-b border-slate-900">
        <Link href="/admin" className="block">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-black tracking-tight text-white">
              MAGNUS PROCURA
            </span>
          </div>
          <div className="flex items-center space-x-1.5 mt-1.5">
            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-purple-500/20 text-purple-400 border border-purple-500/30">
              Root Authority · Executive Admin
            </span>
          </div>
        </Link>
      </div>

      {/* Quick Financial Run-Rate Widget */}
      <div className="px-4 pt-4 pb-2">
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
            <span>Net Margin</span>
            <span className="text-emerald-400 font-mono">62.5%</span>
          </div>
          <div className="text-lg font-black text-white font-mono">$3,000 / Member</div>
          <p className="text-[10px] text-slate-400">Post $120/hr loaded COGS</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                isActive
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Quick Portal Switcher */}
      <div className="p-3 border-t border-slate-900 space-y-1 text-xs">
        <span className="text-[10px] text-slate-400 font-bold uppercase px-2 block">Switch Portals</span>
        <Link href="/ops" className="block px-2 py-1 text-slate-400 hover:text-white rounded hover:bg-slate-900 transition">
          &rarr; Operator Console
        </Link>
        <Link href="/app" className="block px-2 py-1 text-slate-400 hover:text-white rounded hover:bg-slate-900 transition">
          &rarr; Member Portal
        </Link>
        <Link href="/partner/referrals" className="block px-2 py-1 text-slate-400 hover:text-white rounded hover:bg-slate-900 transition">
          &rarr; Partner Portal
        </Link>
      </div>

      {/* Admin Profile Footer */}
      <div className="p-4 border-t border-slate-900">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/60 flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">Chinye Osemene</p>
            <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Managing Partner</p>
          </div>
          <Link
            href="/login"
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
