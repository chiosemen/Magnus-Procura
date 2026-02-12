import React from 'react';

const DigitalVault: React.FC = () => {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-6">
      <h3 className="text-xl font-black">Credential Vault</h3>
      <p className="text-sm text-slate-600 mt-1">
        Secure credential storage is managed by server-side controls and signed upload/download workflows.
      </p>
      <ul className="mt-4 list-disc pl-5 text-sm text-slate-700 space-y-2">
        <li>Least-privilege document access</li>
        <li>Role-based credential visibility</li>
        <li>Audit-ready retrieval logs</li>
      </ul>
    </section>
  );
};

export default DigitalVault;
