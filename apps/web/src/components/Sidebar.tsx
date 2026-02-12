import React from 'react';

import type { Role } from '@shared-types/index';

type View = 'supplier' | 'buyer';

interface SidebarProps {
  role: Role;
  activeView: View;
  setActiveView: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, activeView, setActiveView }) => {
  const tabs: Array<{ id: View; label: string }> = role === 'BUYER'
    ? [{ id: 'buyer', label: 'Buyer Portal' }]
    : role === 'SUPPLIER'
      ? [{ id: 'supplier', label: 'Supplier Portal' }]
      : [
          { id: 'supplier', label: 'Supplier Portal' },
          { id: 'buyer', label: 'Buyer Portal' }
        ];

  return (
    <aside className="w-64 bg-slate-950 h-screen fixed left-0 top-0 text-white p-6">
      <h1 className="text-2xl font-black">MAGNUS PROCURA</h1>
      <p className="text-xs text-slate-400 mt-1">Server-Enforced RBAC</p>
      <nav className="mt-8 space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`w-full text-left rounded-lg px-4 py-3 text-sm font-bold ${
              tab.id === activeView ? 'bg-blue-600' : 'bg-slate-900 hover:bg-slate-800'
            }`}
            onClick={() => setActiveView(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
