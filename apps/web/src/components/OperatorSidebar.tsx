'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  Clock, 
  Timer, 
  Send, 
  CheckSquare, 
  AlertTriangle, 
  LogOut,
  SlidersHorizontal
} from 'lucide-react';

interface OperatorSidebarProps {
  assignedCount?: number;
  maxCapacity?: number;
  pendingAttestationsCount?: number;
}

export default function OperatorSidebar({
  assignedCount = 11,
  maxCapacity = 15,
  pendingAttestationsCount = 2,
}: OperatorSidebarProps) {
  const pathname = usePathname();

  const capacityPct = Math.round((assignedCount / maxCapacity) * 100);
  const isHighCapacity = assignedCount >= 12;

  const navItems = [
    { href: '/ops', label: 'Book of Orgs', icon: Users },
    { href: '/ops/sla', label: 'SLA & Clocks', icon: Clock },
    { href: '/ops/hours', label: '15h Budget & COGS', icon: Timer },
    { href: '/ops/intros', label: 'Intro Studio', icon: Send },
    { 
      href: '/ops/attestations', 
      label: 'Attestations Queue', 
      icon: CheckSquare,
      badge: pendingAttestationsCount > 0 ? `${pendingAttestationsCount} Review` : undefined,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 font-bold',
    },
  ];

  return (
    <aside className="w-64 bg-slate-950 text-white min-h-screen fixed left-0 top-0 flex flex-col border-r border-slate-800/80 z-30">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-900">
        <Link href="/ops" className="block">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-black tracking-tight text-blue-500">
              MAGNUS PROCURA
            </span>
          </div>
          <div className="flex items-center space-x-1.5 mt-1">
            <SlidersHorizontal className="w-3 h-3 text-indigo-400" />
            <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">
              Operator Console
            </span>
          </div>
        </Link>
      </div>

      {/* Book Capacity Gauge (15 Member Max Invariant) */}
      <div className="px-4 pt-4 pb-2">
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-400 font-semibold">Book Capacity</span>
            <span className={`font-black ${isHighCapacity ? 'text-amber-400' : 'text-emerald-400'}`}>
              {assignedCount} / {maxCapacity}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                assignedCount >= maxCapacity 
                  ? 'bg-rose-500' 
                  : isHighCapacity 
                    ? 'bg-amber-500' 
                    : 'bg-blue-500'
              }`} 
              style={{ width: `${Math.min(capacityPct, 100)}%` }}
            />
          </div>
          {isHighCapacity && (
            <div className="flex items-center space-x-1 mt-2 text-[10px] text-amber-400 font-medium">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              <span>Near 15-member operator limit</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/ops' && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Operator Profile & Signout */}
      <div className="p-4 border-t border-slate-900">
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/60 flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">Sarah Chen</p>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Lead Operator · Staff</p>
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
