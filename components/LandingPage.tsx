
import React from 'react';
import { UserRole } from '../types';

interface LandingPageProps {
  onSelectRole: (role: UserRole) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelectRole }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-8">
      <div className="max-w-4xl text-center mb-16">
        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
          MAGNUS PROCURA
        </h1>
        <p className="text-xl md:text-2xl text-slate-400 font-medium">
          The ultimate bridge between agile SMB suppliers and global enterprise demand.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
        <button 
          onClick={() => onSelectRole(UserRole.SUPPLIER)}
          className="group relative bg-slate-800 border border-slate-700 p-12 rounded-3xl text-left hover:bg-slate-700 transition-all hover:scale-[1.02] shadow-2xl overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 text-6xl opacity-10 group-hover:scale-125 transition-transform">🏢</div>
          <h3 className="text-3xl font-bold mb-4">For SMB Suppliers</h3>
          <p className="text-slate-400 mb-8 text-lg">Register with hundreds of buyers instantly. Get audited by Magnus AI. Start bidding today.</p>
          <div className="flex items-center text-blue-400 font-bold group-hover:translate-x-2 transition-transform">
            Enter Supplier Portal <span className="ml-2">→</span>
          </div>
        </button>

        <button 
          onClick={() => onSelectRole(UserRole.BUYER)}
          className="group relative bg-white p-12 rounded-3xl text-left hover:bg-slate-50 transition-all hover:scale-[1.02] shadow-2xl border border-white overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 text-6xl opacity-5 group-hover:scale-125 transition-transform text-slate-900">🌍</div>
          <h3 className="text-3xl font-bold mb-4 text-slate-900">For Corporate Buyers</h3>
          <p className="text-slate-600 mb-8 text-lg">Access a pre-verified pool of diverse, ready-to-contract suppliers across all categories.</p>
          <div className="flex items-center text-blue-600 font-bold group-hover:translate-x-2 transition-transform">
            Enter Buyer Portal <span className="ml-2">→</span>
          </div>
        </button>
      </div>

      <div className="mt-20 flex flex-wrap justify-center gap-12 opacity-30 grayscale contrast-125">
        <span className="text-2xl font-black">ARIBA</span>
        <span className="text-2xl font-black">COUPA</span>
        <span className="text-2xl font-black">JAGGAER</span>
        <span className="text-2xl font-black">FAIRMARKIT</span>
      </div>
    </div>
  );
};

export default LandingPage;