// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

'use client';

export default function AdminDashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center text-black">
      <div className="bg-white p-8 rounded-lg shadow max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
        <p className="text-gray-600 mb-6">{error.message || 'An unexpected error occurred.'}</p>
        <button
          onClick={reset}
          className="bg-brand-primary text-white px-6 py-3 rounded-lg hover:bg-brand-primary-hover font-medium"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
