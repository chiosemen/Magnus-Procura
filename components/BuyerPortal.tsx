
import React, { useState } from 'react';
import { SupplierProfile } from '../types';
import { INITIAL_SUPPLIER } from '../constants';

const BuyerPortal: React.FC = () => {
  const [suppliers] = useState<SupplierProfile[]>([INITIAL_SUPPLIER]);
  const [searchTerm, setSearchTerm] = useState('');
  
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Marketplace Intelligence</h2>
          <p className="text-slate-500 mt-1">Sourcing pre-audited, diverse SMB suppliers across the globe.</p>
        </div>
        <div className="flex space-x-4">
           <button className="px-6 py-3 border border-slate-200 bg-white rounded-xl font-bold text-sm hover:bg-slate-50 transition">Export Supplier Data</button>
           <button className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/20">
            + Post RFP
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Search Keywords</label>
            <input 
              type="text" 
              placeholder="e.g. Cloud Migration" 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Diversity Focus</label>
            <select className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none">
              <option>Any Status</option>
              <option>MBE/WBE</option>
              <option>VOSB</option>
              <option>HUBZone</option>
            </select>
         </div>
         <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Min. Readiness</label>
            <select className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none">
              <option>Any Score</option>
              <option>70% +</option>
              <option>85% +</option>
              <option>95% Platinum</option>
            </select>
         </div>
         <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Region</label>
            <select className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none">
              <option>Global</option>
              <option>North America</option>
              <option>EMEA</option>
              <option>APAC</option>
            </select>
         </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-8 py-5">Supplier Profile</th>
              <th className="px-8 py-5">Diversity & ESG</th>
              <th className="px-8 py-5">Readiness Score</th>
              <th className="px-8 py-5">Network Sync</th>
              <th className="px-8 py-5 text-right">Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {suppliers.map(s => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/10">
                      {s.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{s.name}</p>
                      <p className="text-xs text-slate-500">{s.industry} • {s.revenue}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {s.diversityStatus.map(d => (
                      <span key={d} className="text-[9px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase tracking-tighter">{d}</span>
                    ))}
                    {s.esgPolicies.length > 0 && (
                      <span className="text-[9px] font-black bg-green-50 text-green-600 px-1.5 py-0.5 rounded uppercase tracking-tighter">ESG-READY</span>
                    )}
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${s.readinessScore}%` }}></div>
                    </div>
                    <span className="text-sm font-black text-slate-900">{s.readinessScore}%</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                   <div className="flex -space-x-2">
                      {s.networks.filter(n => n.status === 'active').map(n => (
                        <div key={n.name} className="w-7 h-7 bg-white rounded-full border-2 border-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 shadow-sm" title={n.name}>
                          {n.name[0]}
                        </div>
                      ))}
                   </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <button className="text-blue-600 font-bold text-sm hover:underline px-4 py-2 hover:bg-blue-50 rounded-xl transition-all">Audit Passport</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-8 bg-slate-900 rounded-3xl p-8 flex items-center justify-between text-white">
         <div className="flex items-center space-x-6">
            <div className="text-4xl">⚡</div>
            <div>
               <h4 className="text-xl font-bold">Smart Sourcing Alert</h4>
               <p className="text-slate-400 text-sm">We've found 3 new suppliers matching your "Infrastructure" NAICS codes.</p>
            </div>
         </div>
         <button className="bg-white text-slate-900 px-6 py-3 rounded-xl font-black text-sm uppercase">Review Matches</button>
      </div>
    </div>
  );
};

export default BuyerPortal;
