// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Stats {
  totalVolunteers: number;
  totalOrganizations: number;
  activeEvents: number;
  pendingOrgApprovals: number;
  pendingVolunteerVerifications: number;
  rejectedVolunteers: number;
  rejectedOrganizations: number;
}

interface Profile {
  id: string;
  userId: string;
  user: { name: string; email: string };
  createdAt: string;
  organizationName?: string;
  skills?: string[];
  interests?: string[];
  bio?: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingOrgs, setPendingOrgs] = useState<Profile[]>([]);
  const [pendingVols, setPendingVols] = useState<Profile[]>([]);
  const [approvedVols, setApprovedVols] = useState<Profile[]>([]);
  const [approvedOrgs, setApprovedOrgs] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'error' } | { text: string; type: 'success' } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats').then((res) => res.json()),
      fetch('/api/admin/approvals').then((res) => res.json()),
      fetch('/api/admin/approved').then((res) => res.json()),
    ])
      .then(([statsData, approvalsData, approvedData]) => {
        if (statsData.error || approvalsData.error) {
          window.location.href = '/login';
          return;
        }
        setStats(statsData);
        if (approvalsData.pendingOrganizations) {
          setPendingOrgs(approvalsData.pendingOrganizations);
        }
        if (approvalsData.pendingVolunteers) {
          setPendingVols(approvalsData.pendingVolunteers);
        }
        if (approvedData.approvedVolunteers) {
          setApprovedVols(approvedData.approvedVolunteers);
        }
        if (approvedData.approvedOrganizations) {
          setApprovedOrgs(approvedData.approvedOrganizations);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (userId: string, status: 'APPROVED' | 'REJECTED', profileType: 'org' | 'vol') => {
    setProcessingUserId(userId);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.error || 'Action failed', type: 'error' });
      } else {
        if (profileType === 'org') {
          setPendingOrgs((prev) => prev.filter((o) => o.userId !== userId));
          setStats((prev) => prev ? { ...prev, pendingOrgApprovals: prev.pendingOrgApprovals - 1 } : prev);
        } else {
          setPendingVols((prev) => prev.filter((v) => v.userId !== userId));
          setStats((prev) => prev ? { ...prev, pendingVolunteerVerifications: prev.pendingVolunteerVerifications - 1 } : prev);
        }
        setMessage({ text: data.message, type: 'success' });
        setTimeout(() => setMessage(null), 4000);
      }
    } catch {
      setMessage({ text: 'Network error. Please try again.', type: 'error' });
    } finally {
      setProcessingUserId(null);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  const msgBanner = message ? (
    <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${
      message.type === 'success' ? 'bg-brand-accent-light text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'
    }`}>
      {message.type === 'success' ? '✅ ' : '❌ '}{message.text}
    </div>
  ) : null;

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-6">
            <Link href="/">
              <img src="/logo.png" alt="Voluntry" className="h-[60px] w-auto" />
            </Link>
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-primary text-white font-bold text-sm">
              A
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Administrator</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {msgBanner}

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-gray-500 text-sm font-medium">Total Volunteers</h2>
            <p className="text-3xl font-bold text-brand-primary">{stats?.totalVolunteers || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-gray-500 text-sm font-medium">Total Organizations</h2>
            <p className="text-3xl font-bold text-brand-accent">{stats?.totalOrganizations || 0}</p>
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

        {/* Rejected Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-gray-500 text-sm font-medium">Rejected Volunteers</h2>
            <p className="text-3xl font-bold text-red-600">{stats?.rejectedVolunteers || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-gray-500 text-sm font-medium">Rejected Organizations</h2>
            <p className="text-3xl font-bold text-red-600">{stats?.rejectedOrganizations || 0}</p>
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
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pendingOrgs.map((org) => (
                      <tr key={org.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">{org.organizationName || org.user.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{org.user.email}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {new Date(org.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleStatusChange(org.userId, 'APPROVED', 'org')}
                              disabled={processingUserId === org.userId}
                              className="bg-brand-accent text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {processingUserId === org.userId ? '...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleStatusChange(org.userId, 'REJECTED', 'org')}
                              disabled={processingUserId === org.userId}
                              className="bg-red-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {processingUserId === org.userId ? '...' : 'Reject'}
                            </button>
                          </div>
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
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Skills</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Interests</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Bio</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pendingVols.map((vol) => (
                      <tr key={vol.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">{vol.user.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{vol.user.email}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {vol.skills && vol.skills.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {vol.skills.slice(0, 3).map((s, i) => (
                                <span key={i} className="bg-blue-100 text-brand-primary px-2 py-0.5 rounded text-xs">{s}</span>
                              ))}
                              {vol.skills.length > 3 && <span className="text-xs text-gray-400">+{vol.skills.length - 3}</span>}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {vol.interests && vol.interests.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {vol.interests.slice(0, 2).map((i, idx) => (
                                <span key={idx} className="bg-brand-accent-light text-green-800 px-2 py-0.5 rounded text-xs">{i}</span>
                              ))}
                              {vol.interests.length > 2 && <span className="text-xs text-gray-400">+{vol.interests.length - 2}</span>}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500 max-w-[200px]">
                          {vol.bio ? (
                            <span className="text-xs italic truncate block">{vol.bio.slice(0, 80)}{vol.bio.length > 80 ? '...' : ''}</span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {new Date(vol.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleStatusChange(vol.userId, 'APPROVED', 'vol')}
                              disabled={processingUserId === vol.userId}
                              className="bg-brand-accent text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {processingUserId === vol.userId ? '...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleStatusChange(vol.userId, 'REJECTED', 'vol')}
                              disabled={processingUserId === vol.userId}
                              className="bg-red-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {processingUserId === vol.userId ? '...' : 'Reject'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Approved Users */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Approved Volunteers */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Approved Volunteers</h2>
            {approvedVols.length === 0 ? (
              <p className="text-gray-500">No approved volunteers yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {approvedVols.map((vol) => (
                      <tr key={vol.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">{vol.user?.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{vol.user?.email}</td>
                        <td className="px-4 py-2 text-sm">
                          <Link
                            href={`/dashboard/admin/users/${vol.userId}`}
                            className="text-brand-primary hover:text-brand-primary-hover font-medium"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Approved Organizations */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Approved Organizations</h2>
            {approvedOrgs.length === 0 ? (
              <p className="text-gray-500">No approved organizations yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {approvedOrgs.map((org) => (
                      <tr key={org.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">{org.organizationName || org.user?.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{org.user?.email}</td>
                        <td className="px-4 py-2 text-sm">
                          <Link
                            href={`/dashboard/admin/users/${org.userId}`}
                            className="text-brand-primary hover:text-brand-primary-hover font-medium"
                          >
                            View
                          </Link>
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