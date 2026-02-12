
import React from 'react';
import { UserRole } from '../types';

interface SidebarProps {
  role: UserRole;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, activeTab, setActiveTab }) => {
  const supplierTabs = [
    { id: 'dashboard', label: 'Command Center', icon: '⚡' },
    { id: 'network', label: 'Syndication Engine', icon: '🔄' },
    { id: 'vault', label: 'Credential Vault', icon: '🛡️' },
    { id: 'mobile', label: 'Mobile Demo', icon: '📱' },
    { id: 'profile', label: 'Supplier Profile', icon: '🏢' },
  ];

  const buyerTabs = [
    { id: 'buyer-dash', label: 'Marketplace', icon: '🛒' },
    { id: 'suppliers', label: 'Verified Pool', icon: '✅' },
    { id: 'post-opp', label: 'Active RFPs', icon: '📝' },
    { id: 'analytics', label: 'Insights', icon: '📈' },
  ];

  const tabs = role === UserRole.SUPPLIER ? supplierTabs : buyerTabs;

  return (
    <div className="w-64 bg-slate-950 h-screen fixed left-0 top-0 text-white flex flex-col shadow-2xl z-20">
      <div className="p-8">
        <h1 className="text-3xl font-black tracking-tighter text-blue-500">MAGNUS PROCURA</h1>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Ready to Contract</p>
      </div>
      
      <nav className="flex-1 mt-4 px-4 space-y-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center px-4 py-3.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'
            }`}
          >
            <span className="mr-3 text-xl">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-900">
        <div className="flex items-center space-x-4 p-4 bg-slate-900 rounded-2xl border border-slate-800">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-black text-white shadow-inner">
            {role[0]}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-black truncate text-white">{role} PORTAL</p>
            <p className="text-[10px] text-slate-500 truncate font-bold">VERIFIED ACCESS</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;