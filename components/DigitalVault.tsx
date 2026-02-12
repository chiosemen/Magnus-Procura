
import React from 'react';
import { Document } from '../types';

interface VaultProps {
  documents: Document[];
}

const DigitalVault: React.FC<VaultProps> = ({ documents }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Credential Vault</h3>
          <p className="text-sm text-slate-500">Secure storage for your compliance documents.</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition">
          + Add Document
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map((doc) => (
          <div key={doc.id} className="p-4 border border-slate-200 rounded-xl hover:border-blue-300 transition-all cursor-pointer bg-slate-50/30 group">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm text-xl">
                  {doc.type === 'Insurance' ? '🛡️' : doc.type === 'Audit' ? '🔍' : '📜'}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600">{doc.name}</p>
                  <p className="text-xs text-slate-500">Issuer: {doc.issuer}</p>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${
                doc.status === 'valid' ? 'bg-green-100 text-green-700' :
                doc.status === 'expiring' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                {doc.status}
              </span>
            </div>
            {doc.expiryDate && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Expires: {doc.expiryDate}</span>
                <button className="text-[10px] text-blue-600 font-bold hover:underline">Update</button>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="bg-slate-900 p-6 flex items-center justify-between text-white">
        <div>
          <h4 className="font-bold text-sm">Insurance Adequacy</h4>
          <p className="text-xs text-slate-400">Based on $10M target contracts.</p>
        </div>
        <div className="text-right">
          <p className="text-amber-400 font-bold text-xs uppercase">Gap Detected: Cyber Liability</p>
          <button className="mt-1 text-xs text-blue-400 font-bold hover:underline">Calculate Limits & Get Quote</button>
        </div>
      </div>
    </div>
  );
};

export default DigitalVault;
