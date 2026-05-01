// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Application {
  id: string;
  status: string;
  appliedAt: string;
  event: {
    id: string;
    title: string;
    location: string;
    startDate: string;
    status: string;
  };
}

export default function VolunteerApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/dashboard/volunteer')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setApplications(data.applications || []);
        }
      })
      .catch(() => setError('Failed to load applications'))
      .finally(() => setLoading(false));
  }, []);

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'ACCEPTED':
        return 'bg-brand-accent-light text-green-800 border border-green-300';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center"><p className="text-gray-500">Loading applications...</p></div>;
  if (error) return <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center"><p className="text-red-500">{error}</p></div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/dashboard/volunteer" className="text-brand-primary hover:text-brand-primary text-sm font-medium">&larr; Back to Dashboard</Link>
            <h1 className="text-3xl font-bold mt-2">My Applications</h1>
          </div>
          <Link
            href="/events"
            className="bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-primary-hover font-medium transition-colors"
          >
            Browse Events
          </Link>
        </div>

        {applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No applications yet.</p>
            <p className="text-gray-400 mb-6">Browse events and find the perfect opportunity to make an impact.</p>
            <Link
              href="/events"
              className="bg-brand-primary text-white px-6 py-3 rounded-lg hover:bg-brand-primary-hover font-medium inline-block"
            >
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applied</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{app.event.title}</div>
                      <div className="text-xs text-gray-500">{app.event.status}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{app.event.location}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(app.event.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(app.appliedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusStyles(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}