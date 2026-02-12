
import React, { useState } from 'react';
import { SupplierProfile, Opportunity } from '../types';
import { MOCK_OPPORTUNITIES, INITIAL_SUPPLIER } from '../constants';
import { analyzeSupplierReadiness } from '../services/gemini';
import DigitalVault from './DigitalVault';
import MobileSimulator from './MobileSimulator';

const SupplierPortal: React.FC = () => {
  const [profile, setProfile] = useState<SupplierProfile>(INITIAL_SUPPLIER);
  const [isAuditing, setIsAuditing] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const runAIAudit = async () => {
    setIsAuditing(true);
    const result = await analyzeSupplierReadiness(profile);
    setProfile(prev => ({
      ...prev,
      readinessScore: result.score,
      readinessFeedback: result.feedback
    }));
    setIsAuditing(false);
  };

  const syncNetwork = (networkName: string) => {
    setProfile(prev => ({
      ...prev,
      networks: prev.networks.map(n => 
        n.name === networkName ? { ...n, status: 'active', lastSync: new Date().toISOString().split('T')[0] } : n
      )
    }));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto pb-32">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Supplier Command</h2>
          <p className="text-slate-500 mt-1">Scale your enterprise footprint with Magnus Intelligence.</p>
        </div>
        <div className="flex space-x-2 bg-slate-200/50 p-1 rounded-xl">
          {['dashboard', 'network', 'vault', 'mobile'].map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                activeTab === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* AI Readiness Card */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 opacity-50 transition-transform group-hover:scale-110"></div>
               <div className="relative">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-bold">Readiness Score</h3>
                      <p className="text-slate-500 text-sm">Enterprise Compliance Index</p>
                    </div>
                    <button onClick={runAIAudit} className="bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition">
                      {isAuditing ? 'Auditing...' : 'Re-Analyze Profile'}
                    </button>
                  </div>
                  <div className="flex items-center space-x-12">
                    <div className="text-7xl font-black text-blue-600">{profile.readinessScore}%</div>
                    <div className="flex-1 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <p className="text-slate-700 font-medium leading-relaxed italic">"{profile.readinessFeedback}"</p>
                    </div>
                  </div>
               </div>
            </div>

            {/* Opportunities */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between">
                  <h3 className="font-bold uppercase tracking-widest text-xs text-slate-500">Live Matching Opportunities</h3>
                  <span className="text-blue-600 font-bold text-xs">2 New Today</span>
               </div>
               <div className="divide-y divide-slate-100">
                  {MOCK_OPPORTUNITIES.map(opp => (
                    <div key={opp.id} className="p-6 hover:bg-blue-50/30 transition-colors">
                       <div className="flex justify-between items-start">
                          <div>
                             <h4 className="font-bold text-lg">{opp.title}</h4>
                             <p className="text-sm text-slate-500">{opp.buyerName} • {opp.category}</p>
                             <div className="flex gap-2 mt-3">
                                {opp.requirements.map(r => <span key={r} className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold uppercase text-slate-500">{r}</span>)}
                             </div>
                          </div>
                          <div className="text-right">
                             <div className="text-blue-600 font-black text-xl">{opp.value}</div>
                             <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-lg shadow-blue-500/20">Apply Now</button>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          <div className="space-y-8">
             <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-500/20">
                <h3 className="text-xl font-bold mb-2">Supplier Passport</h3>
                <p className="text-blue-100 text-sm mb-6">Your verified credentials are ready for syndication across 1,200+ buyers.</p>
                <div className="space-y-4">
                   <div className="bg-blue-700/50 p-4 rounded-2xl border border-blue-400/30">
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span>Profile Completion</span>
                        <span>92%</span>
                      </div>
                      <div className="w-full bg-blue-900/50 h-2 rounded-full overflow-hidden">
                        <div className="bg-white h-full" style={{ width: '92%' }}></div>
                      </div>
                   </div>
                   <button onClick={() => setActiveTab('network')} className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-50 transition-colors">
                      Sync to Networks
                   </button>
                </div>
             </div>
             
             <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <h4 className="font-bold mb-4">Quick Stats</h4>
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Active Bids</p>
                      <p className="text-2xl font-black">04</p>
                   </div>
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Profile Views</p>
                      <p className="text-2xl font-black">128</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'network' && (
        <div className="space-y-8">
           <div className="bg-white p-8 rounded-3xl border border-slate-200">
              <h3 className="text-2xl font-bold mb-2">Network Syndication</h3>
              <p className="text-slate-500 mb-8">Push your "One-Source" profile to any major procurement platform with a single click.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {profile.networks.map(net => (
                   <div key={net.name} className="p-6 border border-slate-200 rounded-2xl hover:border-blue-300 transition-all bg-slate-50/50">
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-2xl font-black italic tracking-tighter opacity-20">{net.name.toUpperCase()}</span>
                        <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${
                          net.status === 'active' ? 'bg-green-100 text-green-700' : 
                          net.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'
                        }`}>{net.status}</span>
                      </div>
                      {net.vendorId && <p className="text-xs font-mono text-slate-400 mb-4">Vendor ID: {net.vendorId}</p>}
                      <button 
                        disabled={net.status === 'active'}
                        onClick={() => syncNetwork(net.name)}
                        className={`w-full py-3 rounded-xl text-xs font-bold transition-all ${
                          net.status === 'active' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                        }`}
                      >
                        {net.status === 'active' ? 'Profile Synced' : `Connect to ${net.name}`}
                      </button>
                      {net.lastSync && <p className="mt-3 text-[10px] text-slate-400 text-center font-bold">Last Updated: {net.lastSync}</p>}
                   </div>
                 ))}
                 <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-blue-200 cursor-pointer transition">
                    <span className="text-2xl mb-2">+</span>
                    <span className="text-xs font-bold uppercase">Request New Gateway</span>
                 </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'vault' && <DigitalVault documents={profile.vault} />}
      
      {activeTab === 'mobile' && <MobileSimulator />}
    </div>
  );
};

export default SupplierPortal;
