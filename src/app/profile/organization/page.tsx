// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { organizationProfileSchema, OrganizationProfileFormData } from '@/lib/validations';
import { z } from 'zod';

export default function OrganizationProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [userStatus, setUserStatus] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<OrganizationProfileFormData>({
    userName: '',
    organizationName: '',
    image: '',
    registrationNumber: '',
    address: '',
    description: '',
    website: '',
  });

  useEffect(() => {
    fetch('/api/profile/organization')
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setFormData({
            userName: data.userName || '',
            organizationName: data.profile.organizationName || '',
            image: data.profile.image || '',
            registrationNumber: data.profile.registrationNumber || '',
            address: data.profile.address || '',
            description: data.profile.description || '',
            website: data.profile.website || '',
          });
        } else if (data.userName) {
          setFormData((prev) => ({ ...prev, userName: data.userName }));
        }
        if (data.status) {
          setUserStatus(data.status);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      organizationProfileSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setMessage('Validation failed: ' + error.issues[0].message);
        setSaving(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/profile/organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Profile updated successfully! Status is now PENDING approval.');
      } else {
        setMessage('Error: ' + (data.error || 'Something went wrong'));
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard/organization" className="text-brand-primary hover:text-brand-primary mb-4 inline-block text-sm">&larr; Back to Dashboard</Link>
        <div className="bg-white p-8 rounded-lg shadow">
        {userStatus && userStatus !== 'APPROVED' && (
          <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${
            userStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
            'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {userStatus === 'PENDING' ? (
              <>⏳ Your account is <strong>pending approval</strong>. Some features may be limited.</>
            ) : (
              <>❌ Your account has been <strong>rejected</strong>. Please contact support.</>
            )}
          </div>
        )}
        <h1 className="text-2xl font-bold mb-6">Organization Profile</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Your Name</label>
            <input
              type="text"
              name="userName"
              value={formData.userName}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Profile Image</label>
            <div className="flex items-center gap-4">
              {formData.image ? (
                <img src={formData.image} alt="Profile" className="w-16 h-16 rounded-full object-cover border" />
              ) : (
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 border text-xs text-center">No Image</div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const fd = new FormData();
                  fd.append('file', file);
                  try {
                    const res = await fetch('/api/upload', { method: 'POST', body: fd });
                    const data = await res.json();
                    if (res.ok) {
                      setFormData((prev) => ({ ...prev, image: data.url }));
                    }
                  } catch {}
                }}
                className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-brand-primary-hover hover:file:bg-blue-100"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Organization Name</label>
            <input
              type="text"
              name="organizationName"
              value={formData.organizationName}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Registration Number</label>
            <input
              type="text"
              name="registrationNumber"
              value={formData.registrationNumber}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              rows={2}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              rows={4}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Website</label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="https://example.com"
            />
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded ${message.includes('success') ? 'bg-brand-accent-light text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-brand-primary text-white py-2 px-4 rounded hover:bg-brand-primary-hover disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}