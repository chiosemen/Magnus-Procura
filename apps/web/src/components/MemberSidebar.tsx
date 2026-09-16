'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShieldCheck, 
  Target, 
  Send, 
  BarChart3, 
  CreditCard,
  LogOut
} from 'lucide-react';

interface MemberSidebarProps {
  packetStatus?: 'ready' | 'blocked';
  pendingApprovalCount?: number;
}

export default function MemberSidebar({
  packetStatus = 'ready',
  pendingApprovalCount = 0,
}: MemberSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/app', label: 'Command Center', icon: LayoutDashboard },
    { 
      href: '/packet', 
      label: 'Packet Vault', 
      icon: ShieldCheck, 
      badge: packetStatus === 'ready' ? 'READY' : 'BLOCKED',
      badgeColor: packetStatus === 'ready' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400',
    },
    { href: '/targets', label: 'Target Accounts', icon: Target },
    { 
      href: '/intros', 
      label: 'Intro Ledger', 
      icon: Send,
      badge: pendingApprovalCount > 0 ? `${pendingApprovalCount} Review` : undefined,
      badgeColor: 'bg-blue-500/20 text-blue-400 font-bold',
    },
    { href: '/scoreboard', label: 'Open Scoreboard', icon: BarChart3 },
    { href: '/billing', label: 'Membership & SOW', icon: CreditCard },
  ];

  return (
    <aside className="w-64 bg-slate-950 text-white min-h-screen fixed left-0 top-0 flex flex-col border-r border-slate-800/80 z-30">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-900">
        <Link href="/app" className="block">
          <span className="text-xl font-black tracking-tight text-blue-500 block">
            MAGNUS PROCURA
          </span>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 block">
            The Conversion File
          </span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-900">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/60 flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">Apex Industrial</p>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Member · Year-1</p>
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
