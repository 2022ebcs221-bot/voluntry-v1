// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  volunteerProfile?: {
    phone?: string;
    location?: string;
    image?: string;
    skills: string[];
    interests: string[];
    availability?: string;
    bio?: string;
  } | null;
  organizationProfile?: {
    organizationName: string;
    image?: string;
    registrationNumber?: string;
    address?: string;
    description?: string;
    website?: string;
  } | null;
}

export default function AdminUserViewPage() {
  const params = useParams();
  const userId = params.userId as string;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/admin/users/${userId}/profile`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setUser(data.user);
        }
      })
      .catch(() => setError('Failed to load user'))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center text-black"><p>Loading user details...</p></div>;
  if (error) return <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center text-black"><p className="text-red-500">{error}</p></div>;
  if (!user) return null;

  const isVolunteer = user.role === 'VOLUNTEER';
  const profile = isVolunteer ? user.volunteerProfile : user.organizationProfile;

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard/admin" className="text-brand-primary hover:text-brand-primary mb-4 inline-block">&larr; Back to Dashboard</Link>

        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex items-center gap-4 mb-8">
            {(profile as UserProfile['volunteerProfile'])?.image || (profile as UserProfile['organizationProfile'])?.image ? (
              <img src={(profile as UserProfile['volunteerProfile'])?.image || (profile as UserProfile['organizationProfile'])?.image || ''} alt="" className="w-16 h-16 rounded-full object-cover border" />
            ) : (
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-brand-primary">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-gray-500">{user.email}</p>
              <p className="text-sm">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  user.status === 'APPROVED' ? 'bg-brand-accent-light text-green-800' :
                  user.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>{user.status}</span>
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800">{user.role}</span>
              </p>
            </div>
          </div>

          {isVolunteer && profile && (
            <div className="space-y-6">
              {(profile as UserProfile['volunteerProfile'])?.phone && (
                <div>
                  <p className="text-sm font-bold text-gray-700">Phone</p>
                  <p className="text-gray-600">{(profile as UserProfile['volunteerProfile'])?.phone}</p>
                </div>
              )}
              {(profile as UserProfile['volunteerProfile'])?.location && (
                <div>
                  <p className="text-sm font-bold text-gray-700">Location</p>
                  <p className="text-gray-600">{(profile as UserProfile['volunteerProfile'])?.location}</p>
                </div>
              )}
              {(profile as UserProfile['volunteerProfile'])?.skills && (profile as UserProfile['volunteerProfile'])!.skills!.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-1">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {(profile as UserProfile['volunteerProfile'])!.skills!.map((s: string, i: number) => (
                      <span key={i} className="bg-blue-100 text-brand-primary px-3 py-1 rounded-full text-sm">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {(profile as UserProfile['volunteerProfile'])?.interests && (profile as UserProfile['volunteerProfile'])!.interests!.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-1">Interests</p>
                  <div className="flex flex-wrap gap-2">
                    {(profile as UserProfile['volunteerProfile'])!.interests!.map((i: string, idx: number) => (
                      <span key={idx} className="bg-brand-accent-light text-green-800 px-3 py-1 rounded-full text-sm">{i}</span>
                    ))}
                  </div>
                </div>
              )}
              {(profile as UserProfile['volunteerProfile'])?.availability && (
                <div>
                  <p className="text-sm font-bold text-gray-700">Availability</p>
                  <p className="text-gray-600">{(profile as UserProfile['volunteerProfile'])?.availability}</p>
                </div>
              )}
              {(profile as UserProfile['volunteerProfile'])?.bio && (
                <div>
                  <p className="text-sm font-bold text-gray-700">Bio</p>
                  <p className="text-gray-600 whitespace-pre-wrap">{(profile as UserProfile['volunteerProfile'])?.bio}</p>
                </div>
              )}
            </div>
          )}

          {!isVolunteer && profile && (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-bold text-gray-700">Organization Name</p>
                <p className="text-gray-600">{(profile as UserProfile['organizationProfile'])?.organizationName}</p>
              </div>
              {(profile as UserProfile['organizationProfile'])?.registrationNumber && (
                <div>
                  <p className="text-sm font-bold text-gray-700">Registration Number</p>
                  <p className="text-gray-600">{(profile as UserProfile['organizationProfile'])?.registrationNumber}</p>
                </div>
              )}
              {(profile as UserProfile['organizationProfile'])?.address && (
                <div>
                  <p className="text-sm font-bold text-gray-700">Address</p>
                  <p className="text-gray-600">{(profile as UserProfile['organizationProfile'])?.address}</p>
                </div>
              )}
              {(profile as UserProfile['organizationProfile'])?.description && (
                <div>
                  <p className="text-sm font-bold text-gray-700">Description</p>
                  <p className="text-gray-600 whitespace-pre-wrap">{(profile as UserProfile['organizationProfile'])?.description}</p>
                </div>
              )}
              {(profile as UserProfile['organizationProfile'])?.website && (
                <div>
                  <p className="text-sm font-bold text-gray-700">Website</p>
                  <a href={(profile as UserProfile['organizationProfile'])!.website!} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:text-brand-primary">
                    {(profile as UserProfile['organizationProfile'])?.website}
                  </a>
                </div>
              )}
            </div>
          )}

          {!profile && <p className="text-gray-500">No profile data available.</p>}
        </div>
      </div>
    </div>
  );
}