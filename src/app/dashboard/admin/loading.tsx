// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

export default function AdminDashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center text-black">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    </div>
  );
}
