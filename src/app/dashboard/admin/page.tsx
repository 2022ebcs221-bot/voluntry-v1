// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

'use client';

import { useState, useEffect } from 'react';

interface Stats {
  totalVolunteers: number;
  totalOrganizations: number;
  activeEvents: number;
  pendingOrgApprovals: number;
  pendingVolunteerVerifications: number;
}

interface Profile {
  id: string;
  userId: string;
  user: { name: string; email: string };
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingOrgs, setPendingOrgs] = useState<Profile[]>([]);
  const [pendingVols, setPendingVols] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first');
      window.location.href = '/login';
      return;
    }

    Promise.all([
      fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),
      fetch('/api/admin/approvals', {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),
    ])
      .then(([statsData, approvalsData]) => {
        setStats(statsData);
        if (approvalsData.pendingOrganizations) {
          setPendingOrgs(approvalsData.pendingOrganizations);
        }
        if (approvalsData.pendingVolunteers) {
          setPendingVols(approvalsData.pendingVolunteers);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-gray-500 text-sm font-medium">Total Volunteers</h2>
            <p className="text-3xl font-bold text-blue-600">{stats?.totalVolunteers || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-gray-500 text-sm font-medium">Total Organizations</h2>
            <p className="text-3xl font-bold text-green-600">{stats?.totalOrganizations || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-gray-500 text-sm font-medium">Active Events</h2>
            <p className="text-3xl font-bold text-purple-600">{stats?.activeEvents || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-gray-500 text-sm font-medium">Pending Approvals</h2>
            <p className="text-3xl font-bold text-orange-600">
              {(stats?.pendingOrgApprovals || 0) + (stats?.pendingVolunteerVerifications || 0)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Organizations */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Pending Organization Approvals</h2>
            {pendingOrgs.length === 0 ? (
              <p className="text-gray-500">No pending approvals.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Org Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pendingOrgs.map((org) => (
                      <tr key={org.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">{org.user.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{org.user.email}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {new Date(org.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pending Volunteers */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Pending Volunteer Verifications</h2>
            {pendingVols.length === 0 ? (
              <p className="text-gray-500">No pending verifications.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pendingVols.map((vol) => (
                      <tr key={vol.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">{vol.user.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{vol.user.email}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {new Date(vol.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}