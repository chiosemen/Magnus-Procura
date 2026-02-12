import React, { useMemo, useState } from 'react';

import { EMPTY_READINESS_INPUT } from '../constants';
import type { ContractClause, ReadinessResult, SupplierReadinessInput } from '@shared-types/index';
import { analyzeContract, analyzeSupplierReadiness, suggestCodes } from '../services/gemini';
import DigitalVault from './DigitalVault';

const parseList = (value: string): string[] => {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const SupplierPortal: React.FC = () => {
  const [input, setInput] = useState<SupplierReadinessInput>(EMPTY_READINESS_INPUT);
  const [readiness, setReadiness] = useState<ReadinessResult | null>(null);
  const [description, setDescription] = useState('');
  const [codes, setCodes] = useState<{ naics: string[]; unspsc: string[] } | null>(null);
  const [contractText, setContractText] = useState('');
  const [clauses, setClauses] = useState<ContractClause[]>([]);
  const [error, setError] = useState<string | null>(null);

  const profileCompletion = useMemo(() => {
    const fields = [
      input.legalName,
      input.industry,
      input.certifications.join(','),
      input.esgPolicies.join(','),
      input.diversityStatus.join(',')
    ];

    const complete = fields.filter((field) => field.length > 0).length;
    return Math.round((complete / fields.length) * 100);
  }, [input]);

  const runReadiness = async () => {
    try {
      setError(null);
      const result = await analyzeSupplierReadiness(input);
      setReadiness(result);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Readiness analysis failed');
    }
  };

  const runCodeSuggestion = async () => {
    try {
      setError(null);
      const result = await suggestCodes(description);
      setCodes(result);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Code suggestion failed');
    }
  };

  const runContractAnalysis = async () => {
    try {
      setError(null);
      const result = await analyzeContract(contractText);
      setClauses(result);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Contract analysis failed');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 pb-24">
      <section className="bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="text-2xl font-black">Supplier Readiness</h2>
        <p className="text-sm text-slate-600 mt-1">Server-side AI analysis with RBAC enforcement.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div>
            <label className="block text-sm font-semibold">Legal Name</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={input.legalName}
              onChange={(event) => setInput((current) => ({ ...current, legalName: event.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold">Industry</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={input.industry}
              onChange={(event) => setInput((current) => ({ ...current, industry: event.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold">Certifications (comma-separated)</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={input.certifications.join(', ')}
              onChange={(event) =>
                setInput((current) => ({ ...current, certifications: parseList(event.target.value) }))
              }
            />
          </div>
          <div>
            <label className="block text-sm font-semibold">Diversity Status (comma-separated)</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={input.diversityStatus.join(', ')}
              onChange={(event) =>
                setInput((current) => ({ ...current, diversityStatus: parseList(event.target.value) }))
              }
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold">ESG Policies (comma-separated)</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={input.esgPolicies.join(', ')}
              onChange={(event) => setInput((current) => ({ ...current, esgPolicies: parseList(event.target.value) }))}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-slate-700 font-semibold">Profile completion: {profileCompletion}%</p>
          <button className="rounded-lg bg-slate-900 text-white px-4 py-2 font-semibold" onClick={runReadiness}>
            Analyze Readiness
          </button>
        </div>

        {readiness ? (
          <div className="mt-6 rounded-lg bg-slate-50 border border-slate-200 p-4">
            <p className="text-lg font-black">Score: {readiness.score}</p>
            <p className="text-sm mt-2">{readiness.feedback}</p>
            <ul className="mt-3 list-disc pl-5 text-sm text-slate-700">
              {readiness.gaps.map((gap) => (
                <li key={gap}>{gap}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-6">
        <h3 className="text-xl font-black">NAICS and UNSPSC Suggestions</h3>
        <textarea
          className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 min-h-28"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Describe supplier capabilities"
        />
        <button className="mt-4 rounded-lg bg-blue-600 text-white px-4 py-2 font-semibold" onClick={runCodeSuggestion}>
          Suggest Codes
        </button>
        {codes ? (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-bold">NAICS</p>
              <p>{codes.naics.join(', ')}</p>
            </div>
            <div>
              <p className="font-bold">UNSPSC</p>
              <p>{codes.unspsc.join(', ')}</p>
            </div>
          </div>
        ) : null}
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
              {clause.fallback ? <p className="text-xs text-blue-700 mt-1">Fallback: {clause.fallback}</p> : null}
            </div>
          ))}
        </div>
      </section>

      <DigitalVault />

      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
    </div>
  );
};

export default SupplierPortal;
