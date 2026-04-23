// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

'use client';

import { useState, useEffect } from 'react';
import { organizationProfileSchema, OrganizationProfileFormData } from '@/lib/validations';
import { z } from 'zod';

export default function OrganizationProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [userStatus, setUserStatus] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<OrganizationProfileFormData>({
    organizationName: '',
    contactPerson: '',
    registrationNumber: '',
    address: '',
    description: '',
    website: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first');
      window.location.href = '/login';
      return;
    }

    fetch('/api/profile/organization', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setFormData({
            organizationName: data.profile.organizationName || '',
            contactPerson: data.profile.contactPerson || '',
            registrationNumber: data.profile.registrationNumber || '',
            address: data.profile.address || '',
            description: data.profile.description || '',
            website: data.profile.website || '',
          });
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
        setMessage('Validation failed: ' + error.errors[0].message);
        setSaving(false);
        return;
      }
    }

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/profile/organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
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
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
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
            <label className="block text-gray-700 font-bold mb-2">Contact Person</label>
            <input
              type="text"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
              className="w-full p-2 border rounded"
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
            <div className={`mb-4 p-3 rounded ${message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}