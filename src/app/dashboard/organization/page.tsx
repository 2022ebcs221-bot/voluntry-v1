// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Event {
  id: string;
  title: string;
  status: string;
  startDate: string;
  location: string;
}

interface Application {
  id: string;
  status: string;
  message: string | null;
  appliedAt: string;
  volunteer: {
    user: { name: string; email: string };
  };
  event: {
    title: string;
  };
}

interface Stats {
  [key: string]: {
    total: number;
    pending: number;
    accepted: number;
  };
}

export default function OrganizationDashboardPage() {
  const [profile, setProfile] = useState<{ organizationName: string; image?: string } | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventStats, setEventStats] = useState<Stats>({});
  const [pendingApplications, setPendingApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/dashboard/organization')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          if (data.status) {
            window.location.href = '/status';
            return;
          }
          setError(data.error);
        } else {
          setProfile(data.profile);
          setEvents(data.events);
          setEventStats(data.eventStats);
          setPendingApplications(data.pendingApplications);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

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
                <h1 className="text-3xl font-bold">Organization Dashboard</h1>
                <div className="flex gap-4 mt-1">
                  <Link href="/dashboard/organization/events" className="text-brand-primary hover:text-brand-primary-hover text-sm font-medium">
                    My Events
                  </Link>
                  <Link href="/profile/organization" className="text-brand-primary hover:text-brand-primary-hover text-sm font-medium">
                    Edit Profile
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{profile?.organizationName}</p>
                <p className="text-xs text-gray-500">Organization</p>
              </div>
              {profile?.image && (
                <img src={profile.image} alt="" className="w-10 h-10 rounded-full object-cover border" />
              )}
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Events */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">My Events</h2>
              <Link href="/dashboard/organization/events/create" className="bg-brand-primary text-white px-4 py-2 rounded hover:bg-brand-primary-hover text-sm inline-block">
                Create Event
              </Link>
            </div>
            {events.length === 0 ? (
              <p className="text-gray-500">No events created yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Apps</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {events.map((event) => (
                      <tr key={event.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">{event.title}</td>
                        <td className="px-4 py-2 text-sm">
                           <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            event.status === 'PUBLISHED' ? 'bg-brand-accent-light text-green-800' :
                            event.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                            event.status === 'CLOSED' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-brand-primary'
                          }`}>
                            {event.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {eventStats[event.id]?.total || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pending Applications */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Pending Applications</h2>
            {pendingApplications.length === 0 ? (
              <p className="text-gray-500">No pending applications.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Volunteer</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pendingApplications.map((app) => (
                      <tr key={app.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">{app.volunteer.user.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{app.event.title}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {new Date(app.appliedAt).toLocaleDateString()}
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