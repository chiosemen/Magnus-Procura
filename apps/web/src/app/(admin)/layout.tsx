import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#030712] text-white flex relative overflow-x-hidden selection:bg-purple-500 selection:text-white">
      {/* Background Ambient Fluid Mesh Glows */}
      <div className="fixed top-[-180px] right-[5%] w-[650px] h-[650px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none animate-fluid-1 -z-0" />
      <div className="fixed bottom-[-180px] left-[15%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none animate-fluid-2 -z-0" />
      <div className="fixed top-[40%] right-[30%] w-[450px] h-[450px] bg-blue-600/5 rounded-full blur-[160px] pointer-events-none -z-0" />

      {/* Admin Sidebar */}
      <AdminSidebar />

      {/* Main Content Pane */}
      <div className="ml-64 flex-1 flex flex-col min-h-screen relative z-10">
        {children}
      </div>
    </div>
  );
}
