
import React, { useState } from 'react';
import { UserRole } from './types';
import LandingPage from './components/LandingPage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import SupplierPortal from './components/SupplierPortal';
import BuyerPortal from './components/BuyerPortal';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!userRole) {
    return <LandingPage onSelectRole={setUserRole} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar 
        role={userRole} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />
      
      <main className="ml-64 min-h-screen flex flex-col">
        <Header />
        
        <div className="flex-1 overflow-y-auto">
          {userRole === UserRole.SUPPLIER ? (
            <SupplierPortal />
          ) : (
            <BuyerPortal />
          )}
        </div>
      </main>

      {/* Role Toggle for demo purposes */}
      <button 
        onClick={() => {
          setUserRole(null);
          setActiveTab('dashboard');
        }}
        className="fixed bottom-4 right-4 bg-slate-800 text-white text-xs px-3 py-2 rounded-full font-bold hover:bg-slate-700 z-50 shadow-xl border border-slate-700"
      >
        🔄 Switch Perspective
      </button>
    </div>
  );
};

export default App;
