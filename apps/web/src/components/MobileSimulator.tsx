import React from 'react';

const MobileSimulator: React.FC = () => {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-6">
      <h3 className="text-xl font-black">Mobile Workflows</h3>
      <p className="text-sm text-slate-600 mt-1">
        Mobile production workflows are available through authenticated API endpoints with RBAC enforcement.
      </p>
    </section>
  );
};

export default MobileSimulator;
