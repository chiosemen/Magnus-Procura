'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  DollarSign, 
  Send, 
  LogOut,
  Handshake
} from 'lucide-react';

interface PartnerSidebarProps {
  earnedBountiesCents?: number;
  pendingBountiesCents?: number;
}

export default function PartnerSidebar({
  earnedBountiesCents = 150000, // $1,500
  pendingBountiesCents = 50000,  // $500
}: PartnerSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/partner/referrals', label: 'Supplier Referrals', icon: Users },
    { href: '/partner/bounties', label: 'Keep-90 Bounties', icon: DollarSign },
  ];

  return (
    <aside className="w-64 bg-slate-950 text-white min-h-screen fixed left-0 top-0 flex flex-col border-r border-slate-800/80 z-30">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-900">
        <Link href="/partner/referrals" className="block">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-black tracking-tight text-blue-500">
              MAGNUS PROCURA
            </span>
          </div>
          <div className="flex items-center space-x-1.5 mt-1">
            <Handshake className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">
              Partner Portal
            </span>
          </div>
        </Link>
      </div>

      {/* Bounty Summary Pill */}
      <div className="px-4 pt-4 pb-2">
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Earned Keep Bounties
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-black text-emerald-400">
              ${(earnedBountiesCents / 100).toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              +${(pendingBountiesCents / 100).toLocaleString()} Pending Day 91
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
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

      {/* Partner Organization Profile */}
      <div className="p-4 border-t border-slate-900">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/60 flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">Vanguard Advisory Group</p>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Tier-1 Partner</p>
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
