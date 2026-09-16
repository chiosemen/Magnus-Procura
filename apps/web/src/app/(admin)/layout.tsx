import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Admin Sidebar */}
      <AdminSidebar />

      {/* Main Content Pane */}
      <div className="ml-64 flex-1 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}
