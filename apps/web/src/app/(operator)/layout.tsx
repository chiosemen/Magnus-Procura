import OperatorSidebar from '@/components/OperatorSidebar';

export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Operator Sidebar */}
      <OperatorSidebar assignedCount={11} maxCapacity={15} pendingAttestationsCount={2} />

      {/* Main Content Pane */}
      <div className="ml-64 flex-1 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}
