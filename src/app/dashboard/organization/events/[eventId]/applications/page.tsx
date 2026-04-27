// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Application {
  id: string;
  status: string;
  appliedAt: string;
  message: string | null;
  answers?: { question: string; answer: string }[];
  volunteer: {
    id: string;
    userId: string;
    skills: string[];
    bio: string | null;
    user: { name: string; email: string };
  };
}

export default function EventApplicationsPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [applications, setApplications] = useState<Application[]>([]);
  const [eventTitle, setEventTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [viewingUser, setViewingUser] = useState<{
    name: string;
    email: string;
    image?: string;
    skills: string[];
    interests: string[];
    bio: string;
    availability: string;
    location: string;
    phone: string;
  } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    const fetchApplications = () => {
      fetch(`/api/events/${eventId}/applications`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
          } else {
            setApplications(data.applications || []);
            setEventTitle(data.event?.title || '');
          }
        })
        .catch(() => setError('Failed to load applications'))
        .finally(() => setLoading(false));
    };
    fetchApplications();
  }, [eventId]);

  const handleViewProfile = async (userId: string) => {
    setLoadingProfile(true);
    try {
      const res = await fetch(`/api/users/${userId}/public-profile`);
      const data = await res.json();
      if (data.user) {
        const p = data.user.volunteerProfile || {};
        setViewingUser({
          name: data.user.name,
          email: data.user.email,
          image: p.image,
          skills: p.skills || [],
          interests: p.interests || [],
          bio: p.bio || '',
          availability: p.availability || '',
          location: p.location || '',
          phone: p.phone || '',
        });
      }
    } catch {} finally {
      setLoadingProfile(false);
    }
  };

  const handleStatus = async (applicationId: string, status: 'ACCEPTED' | 'REJECTED') => {
    setProcessingId(applicationId);
    setMessage(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) {
        setApplications((prev) =>
          prev.map((app) =>
            app.id === applicationId ? { ...app, status } : app
          )
        );
        setMessage({ text: data.message, type: 'success' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ text: data.error || 'Action failed', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Network error. Please try again.', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center"><p className="text-gray-500">Loading applications...</p></div>;
  if (error) return <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center"><p className="text-red-500">{error}</p></div>;

  const acceptedCount = applications.filter((a) => a.status === 'ACCEPTED').length;
  const statusCounts = { total: applications.length, pending: applications.filter((a) => a.status === 'PENDING').length, accepted: acceptedCount };

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link href="/dashboard/organization" className="text-brand-primary hover:text-brand-primary text-sm font-medium">&larr; Back to Dashboard</Link>
            <h1 className="text-3xl font-bold mt-1">{eventTitle || 'Applications'}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {statusCounts.pending} pending · {statusCounts.accepted} accepted · {statusCounts.total} total
            </p>
          </div>
          <Link href="/dashboard/organization/events" className="text-brand-primary hover:text-brand-primary text-sm">&larr; Back to Events</Link>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${
            message.type === 'success' ? 'bg-brand-accent-light text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {message.type === 'success' ? '✅ ' : '❌ '}{message.text}
          </div>
        )}

        {applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">No applications received yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{app.volunteer.user.name}</h3>
                      <button
                        onClick={() => handleViewProfile(app.volunteer.userId || app.volunteer.id)}
                        className="text-brand-primary hover:text-brand-primary-hover text-xs font-medium"
                      >
                        View Profile
                      </button>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        app.status === 'ACCEPTED' ? 'bg-brand-accent-light text-green-800 border border-green-300' :
                        app.status === 'REJECTED' ? 'bg-red-100 text-red-800 border border-red-300' :
                        'bg-yellow-100 text-yellow-800 border border-yellow-300'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{app.volunteer.user.email}</p>
                    <p className="text-xs text-gray-400 mb-3">Applied {new Date(app.appliedAt).toLocaleDateString()}</p>

                    {app.message && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                        <span className="font-bold">Message: </span>{app.message}
                      </div>
                    )}

                    {app.answers && app.answers.length > 0 && (
                      <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-100">
                        <p className="text-xs font-bold text-brand-primary mb-2">Application Answers</p>
                        {app.answers.map((a, i) => (
                          <div key={i} className="mb-2">
                            <p className="text-xs font-semibold text-brand-primary-hover">{a.question}</p>
                            <p className="text-sm text-brand-primary-hover">{a.answer}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {app.status === 'PENDING' && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleStatus(app.id, 'ACCEPTED')}
                        disabled={processingId === app.id}
                        className="bg-brand-accent text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {processingId === app.id ? '...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleStatus(app.id, 'REJECTED')}
                        disabled={processingId === app.id}
                        className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {processingId === app.id ? '...' : 'Reject'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Profile Modal */}
        {viewingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewingUser(null)}>
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  {viewingUser.image ? (
                    <img src={viewingUser.image} alt="" className="w-16 h-16 rounded-full object-cover border" />
                  ) : (
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-brand-primary">
                      {viewingUser.name[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold">{viewingUser.name}</h2>
                    <p className="text-sm text-gray-500">{viewingUser.email}</p>
                  </div>
                </div>
                <button onClick={() => setViewingUser(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
              </div>

              {viewingUser.skills.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-bold text-gray-700 mb-1">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {viewingUser.skills.map((s, i) => (
                      <span key={i} className="bg-blue-100 text-brand-primary px-3 py-1 rounded-full text-sm">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {viewingUser.interests.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-bold text-gray-700 mb-1">Interests</p>
                  <div className="flex flex-wrap gap-2">
                    {viewingUser.interests.map((i, idx) => (
                      <span key={idx} className="bg-brand-accent-light text-green-800 px-3 py-1 rounded-full text-sm">{i}</span>
                    ))}
                  </div>
                </div>
              )}

              {viewingUser.bio && <div className="mb-4"><p className="text-sm font-bold text-gray-700 mb-1">Bio</p><p className="text-gray-600 text-sm">{viewingUser.bio}</p></div>}
              {viewingUser.location && <div className="mb-4"><p className="text-sm font-bold text-gray-700 mb-1">Location</p><p className="text-gray-600 text-sm">{viewingUser.location}</p></div>}
              {viewingUser.phone && <div className="mb-4"><p className="text-sm font-bold text-gray-700 mb-1">Phone</p><p className="text-gray-600 text-sm">{viewingUser.phone}</p></div>}
              {viewingUser.availability && <div className="mb-4"><p className="text-sm font-bold text-gray-700 mb-1">Availability</p><p className="text-gray-600 text-sm">{viewingUser.availability}</p></div>}

              {loadingProfile && <p className="text-center text-gray-500 py-4">Loading profile...</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}