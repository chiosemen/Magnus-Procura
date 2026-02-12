
import React, { useState, useEffect } from 'react';
import { 
  Opportunity, 
  ContractClause, 
  ClauseAction, 
  RedlineHistoryItem, 
  MobileAppState, 
  VerticalType,
  Document
} from '../types';
import { MOCK_OPPORTUNITIES, INITIAL_SUPPLIER } from '../constants';
import { analyzeContract } from '../services/gemini';

const MAGNUS_TEAL = '#0A5C4B';
const MAGNUS_NAVY = '#1E3A5F';
const MAGNUS_AMBER = '#FFB347';

const MobileSimulator: React.FC = () => {
  // --- STATE ---
  const [appState, setAppState] = useState<MobileAppState>({
    onboardingComplete: true, 
    pursuedOpportunityIds: [],
    vertical: 'Tech',
  });
  
  const [navStack, setNavStack] = useState<string[]>(['home']);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedOppId, setSelectedOppId] = useState<string | null>(null);
  const [isBiometricPrompt, setIsBiometricPrompt] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Simulation states
  const [networkStatus, setNetworkStatus] = useState<Record<string, string>>({
    'Ariba': 'ACTIVE',
    'Coupa': 'PENDING',
    'Jaggaer': 'NONE',
    'Fairmarkit': 'NONE'
  });

  const [history, setHistory] = useState<RedlineHistoryItem[]>([]);

  // --- HELPERS ---
  const currentScreen = navStack[navStack.length - 1];
  const selectedOpp = MOCK_OPPORTUNITIES.find(o => o.id === selectedOppId);
  
  const navigateTo = (screen: string) => {
    setNavStack([...navStack, screen]);
    setShowHistory(false);
  };
  
  const goBack = () => {
    if (navStack.length > 1) {
      setNavStack(navStack.slice(0, -1));
    }
  };

  const handleSync = (name: string) => {
    setNetworkStatus(prev => ({ ...prev, [name]: 'SYNCING...' }));
    setTimeout(() => {
      setNetworkStatus(prev => ({ ...prev, [name]: 'ACTIVE' }));
    }, 1500);
  };

  const debugCycleStatus = (name: string) => {
    const sequence = ['NONE', 'PENDING', 'ACTIVE'];
    const currentStatus = networkStatus[name];
    if (currentStatus === 'SYNCING...') return;
    
    const currentIndex = sequence.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % sequence.length;
    setNetworkStatus(prev => ({ ...prev, [name]: sequence[nextIndex] }));
  };

  const handleAcceptStandard = () => {
    setIsBiometricPrompt(true);
    // Simulate biometric processing
    setTimeout(() => {
      setIsBiometricPrompt(false);
      const timestamp = new Date().toLocaleString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
      
      const newDecision: RedlineHistoryItem = {
        id: `AUTH-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        timestamp,
        contractSnippet: "Standard Master Service Agreement - Global Terms v2024.4",
        clauses: [],
        decisions: { 0: 'accepted' }
      };
      
      setHistory([newDecision, ...history]);
      setSuccessMsg("Standard Terms Accepted & Verified");
      
      // Auto-hide success message
      setTimeout(() => setSuccessMsg(null), 3000);
    }, 1800);
  };

  // --- RENDERING COMPONENTS ---

  const renderHome = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Supplier Command</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nova Solutions Global LLC</p>
        </div>
        <div className="w-10 h-10 rounded-full border-2 border-slate-100 flex items-center justify-center text-xl bg-white shadow-sm">👤</div>
      </div>

      <div style={{ backgroundColor: MAGNUS_NAVY }} className="rounded-[2.5rem] p-6 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500 rounded-full -mr-16 -mt-16 opacity-10 blur-3xl"></div>
        <div className="flex items-center space-x-6">
           <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="transparent" />
                <circle cx="48" cy="48" r="40" stroke="#4ade80" strokeWidth="8" fill="transparent" 
                        strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.72)} />
              </svg>
              <div className="absolute text-center">
                <span className="text-2xl font-black">72</span>
                <span className="text-xs font-bold">%</span>
              </div>
           </div>
           <div className="flex-1">
              <p className="text-[10px] font-black uppercase text-teal-400 tracking-widest mb-1">Enterprise Readiness</p>
              <h3 className="text-sm font-bold leading-tight">Reach 90% to unlock Platinum Opportunities</h3>
              <p className="text-[10px] text-slate-400 mt-2">1 Gap: Cyber Liability Insurance</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Bids</p>
          <p className="text-xl font-black text-slate-900">04</p>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Profile Views</p>
          <div className="flex items-center space-x-2">
            <p className="text-xl font-black text-slate-900">128</p>
            <span className="text-[8px] bg-green-100 text-green-600 px-1 rounded font-bold">↑12%</span>
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Live Matches</h3>
          <span className="text-[10px] font-bold text-teal-600">View All</span>
        </div>
        <div className="flex space-x-4 overflow-x-auto pb-4 no-scrollbar">
          {MOCK_OPPORTUNITIES.map(opp => (
            <button 
              key={opp.id}
              onClick={() => { setSelectedOppId(opp.id); navigateTo('detail'); }}
              className="min-w-[240px] bg-white p-5 rounded-[2rem] shadow-md border border-slate-100 text-left relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rounded-bl-[2rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <span className="text-teal-600 font-bold">→</span>
              </div>
              <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">{opp.category}</span>
              <h4 className="font-bold text-sm text-slate-900 mb-1 truncate">{opp.title}</h4>
              <p className="text-[10px] text-slate-500 mb-4">{opp.buyerName}</p>
              <div className="flex justify-between items-center">
                 <span className="text-xs font-black text-teal-700">{opp.value}</span>
                 <div className="bg-teal-50 text-teal-700 text-[9px] font-black px-2 py-1 rounded-full">{opp.matchScore}% Match</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      <button className="w-full py-4 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 text-[10px] font-black uppercase tracking-widest">
         Switch Perspective
      </button>
    </div>
  );

  const renderNetwork = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="px-1">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Syndication Engine</h2>
        <p className="text-xs text-slate-500">Push your verified profile to global networks.</p>
      </div>

      <div className="space-y-4">
        {Object.entries(networkStatus).map(([name, status]) => (
          <div key={name} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group relative">
            <div className="flex items-center space-x-4">
               <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-xl border border-slate-100 font-black italic opacity-30">
                 {name[0]}
               </div>
               <div>
                  <h4 className="font-bold text-sm text-slate-900">{name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Vendor ID: {status === 'ACTIVE' ? 'V-9921' : 'None'}</p>
               </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={(e) => { e.stopPropagation(); debugCycleStatus(name); }}
                className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] hover:bg-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Debug Toggle Status"
              >
                ⚙️
              </button>
              <button 
                onClick={() => handleSync(name)}
                disabled={status === 'ACTIVE' || status === 'SYNCING...'}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                  status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 
                  status === 'SYNCING...' ? 'bg-amber-100 text-amber-700 animate-pulse' : 
                  'bg-slate-900 text-white shadow-lg shadow-slate-900/10 active:scale-95'
                }`}
              >
                {status === 'ACTIVE' ? 'Synced' : status === 'SYNCING...' ? 'Syncing' : 'Connect'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full py-5 bg-slate-50 border border-slate-200 rounded-[2rem] flex flex-col items-center justify-center group hover:bg-white hover:border-teal-500 transition-all">
         <span className="text-xl mb-1">➕</span>
         <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-teal-600">Request New Gateway</span>
      </button>
    </div>
  );

  const renderVault = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="px-1 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Credential Vault</h2>
          <p className="text-xs text-slate-500">Verified compliance artifacts.</p>
        </div>
        <button className="bg-teal-600 text-white w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-600/20 active:scale-95">+</button>
      </div>

      <div className="space-y-3">
        {[
          { name: 'General Liability COI', issuer: 'Liberty Mutual', expiry: '2025-01-15', status: 'VALID' },
          { name: 'Cyber Liability Policy', issuer: 'Chubb', expiry: '2024-06-30', status: 'EXPIRED', urgent: true },
          { name: 'SOC2 Type II Report', issuer: 'Deloitte', expiry: '2024-12-10', status: 'VALID' },
          { name: 'WBE Certification', issuer: 'WBENC', expiry: '2026-03-20', status: 'VALID' },
        ].map(doc => (
          <div key={doc.name} className={`p-5 rounded-[2rem] border bg-white shadow-sm flex items-center justify-between transition-all ${doc.urgent ? 'border-red-200 ring-2 ring-red-50' : 'border-slate-100'}`}>
            <div className="flex items-center space-x-4">
               <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg">
                 {doc.name.includes('Insurance') ? '🛡️' : doc.name.includes('SOC2') ? '🔍' : '📜'}
               </div>
               <div>
                  <h4 className="font-bold text-[11px] text-slate-900 leading-tight">{doc.name}</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">{doc.issuer} • Exp: {doc.expiry}</p>
               </div>
            </div>
            <span className={`text-[8px] font-black px-2 py-1 rounded-full ${doc.status === 'VALID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {doc.status}
            </span>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: MAGNUS_NAVY }} className="p-6 rounded-[2.5rem] text-white shadow-xl">
         <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[9px] font-black text-teal-400 uppercase tracking-widest mb-1">Insurance Adequacy</p>
              <h4 className="text-sm font-bold">Target: $10M Contracts</h4>
            </div>
            <span className="bg-amber-500 text-slate-900 text-[8px] font-black px-2 py-1 rounded-full">GAP DETECTED</span>
         </div>
         <p className="text-[11px] text-slate-300 leading-relaxed mb-4">Your current Cyber Liability limits are below enterprise standards for high-value tech RFPs.</p>
         <button className="w-full py-3 bg-teal-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
           Calculate Limits & Get Quote
         </button>
      </div>
    </div>
  );

  const renderMobile = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="px-1 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Legal Command</h2>
          <p className="text-xs text-slate-500">Mobile decision engine.</p>
        </div>
        {history.length > 0 && (
          <button onClick={() => setShowHistory(!showHistory)} className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">
            {showHistory ? 'Back to Radar' : 'View History'}
          </button>
        )}
      </div>

      {showHistory ? (
        <div className="space-y-3 pb-20 animate-in slide-in-from-right duration-300">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Verified Audit Log</h3>
          {history.map(item => (
            <div key={item.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-16 h-16 bg-green-50 rounded-bl-[2rem] flex items-center justify-center opacity-30">
                 <span className="text-green-600 text-xs font-black">✓</span>
               </div>
               <div className="flex justify-between items-center mb-3">
                 <span className="text-[9px] font-black text-teal-600 tracking-tight">{item.timestamp}</span>
                 <span className="text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-black uppercase">ACCEPTED</span>
               </div>
               <p className="text-[11px] font-bold text-slate-900 leading-tight mb-3">"{item.contractSnippet}"</p>
               <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                 <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Biometric Verified</span>
                 </div>
                 <span className="text-[8px] font-mono text-slate-300 uppercase">ID: {item.id}</span>
               </div>
            </div>
          ))}
          {history.length === 0 && (
             <div className="text-center py-20 opacity-20">
                <span className="text-4xl">📭</span>
                <p className="text-xs font-black mt-4 uppercase tracking-widest">No contract activity logged</p>
             </div>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-3">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Deadline Radar</h3>
             {MOCK_OPPORTUNITIES.slice(0, 2).map(opp => (
               <div key={opp.id} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden relative group">
                  <div className="flex justify-between items-start mb-3">
                     <span className="text-[8px] bg-red-100 text-red-600 px-2 py-1 rounded font-black uppercase">Express in 12h</span>
                     <span className="text-[9px] font-bold text-slate-400">{opp.type}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mb-1">{opp.title}</h4>
                  <p className="text-[10px] text-slate-500 mb-4">{opp.buyerName}</p>
                  <div className="flex gap-2">
                    <button className="flex-1 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all">Express RFQ</button>
                    <button className="flex-1 py-3 border border-slate-200 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all">Pass</button>
                  </div>
               </div>
             ))}
          </div>

          <div style={{ backgroundColor: MAGNUS_TEAL }} className="p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden text-center">
             <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white rounded-full opacity-5"></div>
             <h3 className="text-xl font-black tracking-tight mb-2 uppercase">Ready to Contract</h3>
             <p className="text-[11px] text-teal-100 leading-relaxed mb-6 px-4">Instantly verify and accept industry-standard terms to accelerate contract execution with one tap.</p>
             <button 
                onClick={handleAcceptStandard}
                className="w-full py-5 bg-white text-teal-900 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
             >
               Accept Standard
             </button>
             <p className="text-[9px] text-teal-400 mt-4 uppercase font-bold tracking-widest">Biometric verification enabled</p>
          </div>
        </>
      )}
    </div>
  );

  // --- MAIN PHONE FRAME ---

  return (
    <div className="flex items-center justify-center py-12 bg-slate-100 rounded-[4rem] border border-slate-200">
      <div className="w-[360px] h-[740px] bg-white rounded-[3.5rem] shadow-2xl border-[10px] border-slate-900 overflow-hidden relative flex flex-col font-inter">
        
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-slate-900 rounded-b-[1.5rem] z-50"></div>
        
        {/* Screen Content Wrapper */}
        <div className="flex-1 overflow-y-auto px-5 pt-12 pb-24 bg-slate-50 relative">
          
          {/* Biometric Simulation Overlay */}
          {isBiometricPrompt && (
            <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-white p-8 text-center animate-in fade-in zoom-in duration-300">
               <div className="w-28 h-28 rounded-full border-4 border-teal-500 flex items-center justify-center mb-6 animate-pulse relative">
                 <span className="text-6xl relative z-10">☝️</span>
                 <div className="absolute inset-0 bg-teal-500 rounded-full opacity-20 animate-ping"></div>
               </div>
               <h4 className="text-2xl font-black mb-2 uppercase tracking-tight">Authenticating</h4>
               <p className="text-slate-400 text-sm leading-relaxed">Verifying Identity via Secure Enclave. Your decision is being cryptographically signed.</p>
            </div>
          )}

          {/* Success Overlay */}
          {successMsg && (
            <div className="absolute top-14 left-5 right-5 bg-green-600 text-white p-4 rounded-[1.5rem] z-[110] flex items-center justify-center space-x-3 shadow-2xl animate-in slide-in-from-top-4 duration-300">
               <span className="text-lg">✅</span>
               <span className="text-[10px] font-black uppercase tracking-widest">{successMsg}</span>
            </div>
          )}

          {currentScreen === 'home' && renderHome()}
          {currentScreen === 'network' && renderNetwork()}
          {currentScreen === 'vault' && renderVault()}
          {currentScreen === 'mobile' && renderMobile()}
          {currentScreen === 'detail' && (
            <div className="space-y-6 pb-12 animate-in slide-in-from-right duration-300">
               <button onClick={goBack} className="text-slate-400 font-bold flex items-center text-xs uppercase tracking-widest"><span className="text-lg mr-2">←</span> Back</button>
               <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2 leading-tight">{selectedOpp?.title}</h2>
                  <p className="text-sm font-bold text-teal-600 mb-6">{selectedOpp?.buyerName}</p>
                  <div className="p-4 bg-slate-50 rounded-2xl mb-6">
                    <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Description</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{selectedOpp?.description}</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-400 uppercase tracking-widest">Est. Value</span>
                      <span className="font-black text-slate-900">{selectedOpp?.value}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-400 uppercase tracking-widest">Compliance Match</span>
                      <span className="font-black text-green-600">{selectedOpp?.matchScore}%</span>
                    </div>
                  </div>
               </div>
               <button className="w-full py-4 bg-teal-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">Apply Now</button>
            </div>
          )}
        </div>

        {/* Tab Bar Nav */}
        <div className="h-24 bg-white/95 backdrop-blur-md border-t border-slate-100 absolute bottom-0 left-0 right-0 flex items-center justify-around px-5 pb-6 pt-2 z-40">
          {[
            { id: 'home', icon: '⚡', label: 'Command' },
            { id: 'network', icon: '🔄', label: 'Network' },
            { id: 'vault', icon: '🛡️', label: 'Vault' },
            { id: 'mobile', icon: '📱', label: 'Mobile' },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); navigateTo(tab.id); }}
              className={`flex flex-col items-center flex-1 transition-all duration-300 ${activeTab === tab.id ? 'text-teal-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl mb-1 transition-colors ${activeTab === tab.id ? 'bg-teal-50' : ''}`}>
                {tab.icon}
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="ml-16 max-w-sm hidden xl:block">
        <h1 style={{ color: MAGNUS_TEAL }} className="text-4xl font-black tracking-tighter mb-4">MAGNUS PROCURA</h1>
        <p className="text-xl font-bold text-slate-900 mb-6">Native Mobile Prototype v2.2</p>
        
        <div className="space-y-6">
           <div className="p-6 bg-white rounded-[2rem] border border-slate-200 shadow-sm">
              <p className="text-[10px] font-black uppercase text-teal-600 tracking-widest mb-1">Audit-Grade Decisions</p>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Experience legal-grade mobile contracting. Use the "Mobile" tab to test industry-standard term acceptance with biometric logging.
              </p>
           </div>
           
           <ul className="space-y-6">
             <li className="flex items-start space-x-4">
               <div style={{ backgroundColor: MAGNUS_TEAL }} className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-black">72</div>
               <div>
                  <p className="font-black text-xs uppercase tracking-widest text-slate-900 mb-1">Smart Readiness</p>
                  <p className="text-xs text-slate-500 leading-relaxed">Real-time analysis of your compliance profile against global buyer requirements.</p>
               </div>
             </li>
             <li className="flex items-start space-x-4">
               <div style={{ backgroundColor: MAGNUS_NAVY }} className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-sm">🛡️</div>
               <div>
                  <p className="font-black text-xs uppercase tracking-widest text-slate-900 mb-1">Credential Syndication</p>
                  <p className="text-xs text-slate-500 leading-relaxed">Push verified artifacts to Ariba, Coupa, and Jaggaer from one central command point.</p>
               </div>
             </li>
           </ul>
        </div>
      </div>
    </div>
  );
};

export default MobileSimulator;
