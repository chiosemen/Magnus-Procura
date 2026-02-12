import React, { useEffect, useState } from 'react';

import type { ContractClause, Opportunity } from '@shared-types/index';
import { analyzeContract, fetchBuyerOpportunities } from '../services/gemini';

const BuyerPortal: React.FC = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [contractText, setContractText] = useState('');
  const [clauses, setClauses] = useState<ContractClause[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const response = await fetchBuyerOpportunities();
        setOpportunities(response);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Failed to load opportunities');
      }
    };

    void load();
  }, []);

  const runContractAnalysis = async () => {
    try {
      setError(null);
      const response = await analyzeContract(contractText);
      setClauses(response);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Contract analysis failed');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 pb-24">
      <section className="bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="text-2xl font-black">Buyer Marketplace</h2>
        <p className="text-sm text-slate-600 mt-1">This data is protected by server RBAC.</p>

        <div className="mt-6 space-y-3">
          {opportunities.map((opportunity) => (
            <article key={opportunity.id} className="rounded-lg border border-slate-200 p-4">
              <h3 className="font-bold text-slate-900">{opportunity.title}</h3>
              <p className="text-sm text-slate-600 mt-1">
                {opportunity.category} • {opportunity.value} • Deadline {opportunity.deadline}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-6">
        <h3 className="text-xl font-black">Contract Risk Analysis</h3>
        <textarea
          className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 min-h-32"
          value={contractText}
          onChange={(event) => setContractText(event.target.value)}
          placeholder="Paste contract text (minimum 50 characters)"
        />
        <button className="mt-4 rounded-lg bg-blue-600 text-white px-4 py-2 font-semibold" onClick={runContractAnalysis}>
          Analyze Contract
        </button>

        <div className="mt-4 space-y-3">
          {clauses.map((clause) => (
            <div key={`${clause.type}-${clause.text}`} className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-black uppercase text-slate-500">{clause.type}</p>
              <p className="text-sm mt-1">{clause.text}</p>
              <p className="text-xs text-slate-600 mt-1">{clause.comment}</p>
            </div>
          ))}
        </div>
      </section>

      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
    </div>
  );
};

export default BuyerPortal;
