import PartnerSidebar from '@/components/PartnerSidebar';

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Partner Sidebar */}
      <PartnerSidebar earnedBountiesCents={150000} pendingBountiesCents={50000} />

      {/* Main Content Pane */}
      <div className="ml-64 flex-1 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}
