'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  DollarSign, 
  Users, 
  Layers, 
  ScrollText, 
  LogOut,
  Sparkles,
  ShieldAlert,
  ArrowUpRight
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
    <aside className="w-64 min-h-screen fixed left-0 top-0 flex flex-col z-30 liquid-glass border-r border-white/10 backdrop-blur-2xl bg-slate-950/70 shadow-[inset_-1px_0_0_rgba(255,255,255,0.05)]">
      {/* Brand & Admin Badge */}
      <div className="p-6 border-b border-white/10 relative">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
        <Link href="/admin" className="block group">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-black text-white text-xs shadow-lg shadow-purple-500/30 group-hover:scale-105 transition">
              M
            </div>
            <span className="text-base font-black tracking-tight text-white group-hover:text-purple-300 transition">
              MAGNUS PROCURA
            </span>
          </div>
          <div className="flex items-center space-x-1.5 mt-2.5">
            <span className="liquid-pill px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest text-purple-300 border-purple-500/30 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span>Root Authority · Admin</span>
            </span>
          </div>
        </Link>
      </div>

      {/* Quick Financial Run-Rate Liquid Widget */}
      <div className="px-4 pt-4 pb-2">
        <div className="liquid-glass-interactive p-4 rounded-2xl specular-edge relative">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            <span>Net Contribution</span>
            <span className="text-emerald-400 font-mono font-bold flex items-center space-x-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>62.5%</span>
            </span>
          </div>
          <div className="text-xl font-black text-white font-mono mt-1">$3,000 / Member</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Post $120/hr loaded COGS (15h)</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                isActive
                  ? 'bg-purple-600/90 text-white shadow-lg shadow-purple-600/30 border border-purple-400/40 backdrop-blur-md'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#fff]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Quick Portal Switcher */}
      <div className="p-3 border-t border-white/10 space-y-1 text-xs">
        <span className="text-[10px] text-slate-400 font-bold uppercase px-2 block tracking-wider">Portals</span>
        <Link 
          href="/ops" 
          className="flex items-center justify-between px-2.5 py-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.04] transition group"
        >
          <span>Operator Console</span>
          <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
        </Link>
        <Link 
          href="/app" 
          className="flex items-center justify-between px-2.5 py-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.04] transition group"
        >
          <span>Member Portal</span>
          <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
        </Link>
        <Link 
          href="/partner/referrals" 
          className="flex items-center justify-between px-2.5 py-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.04] transition group"
        >
          <span>Partner Portal</span>
          <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
        </Link>
      </div>

      {/* Admin Profile Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="liquid-glass p-3 rounded-xl flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">Chinye Osemene</p>
            <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Managing Partner</p>
          </div>
          <Link
            href="/login"
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.08] transition"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
