// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  category: string;
  status: string;
}

interface Application {
  id: string;
  status: string;
  appliedAt: string;
  event: Event;
}

interface Profile {
  id: string;
  completionPercentage: number;
  user: { name: string };
  image?: string;
}

export default function VolunteerDashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [recommendedEvents, setRecommendedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/dashboard/volunteer')
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
          setApplications(data.applications);
          setRecommendedEvents(data.recommendedEvents);
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
                <h1 className="text-3xl font-bold">Volunteer Dashboard</h1>
                <div className="flex gap-4 mt-1">
                  <Link href="/events" className="text-brand-primary hover:text-brand-primary-hover text-sm font-medium">
                    Browse Events
                  </Link>
                  <Link href="/dashboard/volunteer/applications" className="text-brand-primary hover:text-brand-primary-hover text-sm font-medium">
                    My Applications
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Welcome, {profile?.user?.name || 'Volunteer'}</p>
                <p className="text-xs text-gray-500">Volunteer</p>
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

        {/* Profile Completion */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Profile Completion</h2>
            <a
              href="/profile/volunteer"
              className="bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-primary-hover font-medium text-sm transition-colors"
            >
              Edit Profile
            </a>
          </div>
          <div className="flex items-center">
            <div className="w-full bg-gray-200 rounded-full h-4 mr-4">
              <div 
                className="bg-brand-primary h-4 rounded-full" 
                style={{ width: `${profile?.completionPercentage || 0}%` }}
              ></div>
            </div>
            <span className="font-bold text-brand-primary">{profile?.completionPercentage || 0}%</span>
          </div>
          {profile?.completionPercentage !== undefined && profile.completionPercentage < 100 && (
            <p className="text-sm text-gray-500 mt-2">
              Complete your profile to get better recommendations!
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Applied Events */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">My Applications</h2>
            {applications.length === 0 ? (
              <p className="text-gray-500">No applications yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {applications.map((app) => (
                      <tr key={app.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">{app.event.title}</td>
                        <td className="px-4 py-2 text-sm"><span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          app.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          app.status === 'ACCEPTED' ? 'bg-brand-accent-light text-green-800' :
                          app.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>{app.status}</span></td>
                        <td className="px-4 py-2 text-sm text-gray-500">{new Date(app.appliedAt).toLocaleDateString()}</td>
                        <td className="px-4 py-2 text-sm">
                          <Link href={`/events/${app.event.id}`} className="text-brand-primary hover:text-brand-primary-hover font-medium text-xs">
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

          {/* Recommended Events */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Recommended Events</h2>
            {recommendedEvents.length === 0 ? (
              <p className="text-gray-500">No recommended events found.</p>
            ) : (
              <div className="space-y-4">
                {recommendedEvents.map((event) => (
                  <div key={event.id} className="border-b pb-4 last:border-0">
                    <h3 className="font-bold text-lg">{event.title}</h3>
                    <p className="text-sm text-gray-600">{event.category} • {event.location}</p>
                    <p className="text-xs text-gray-500 mb-2">{new Date(event.startDate).toLocaleDateString()}</p>
                    <div className="flex gap-2">
                      <Link
                        href={`/events/${event.id}`}
                        className="bg-brand-primary text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-brand-primary-hover transition-colors"
                      >
                        View & Apply
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 text-center">
              <Link href="/events" className="text-brand-primary hover:text-brand-primary text-sm font-medium">
                Browse All Events &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}