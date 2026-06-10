// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { volunteerProfileSchema, VolunteerProfileFormData } from '@/lib/validations';
import { z } from 'zod';

export default function VolunteerProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [userStatus, setUserStatus] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<VolunteerProfileFormData>({
    name: '',
    phone: '',
    location: '',
    image: '',
    skills: [],
    interests: [],
    availability: '',
    bio: '',
  });

  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');

  useEffect(() => {
    fetch('/api/profile/volunteer')
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setFormData({
            name: data.userName || '',
            phone: data.profile.phone || '',
            location: data.profile.location || '',
            image: data.profile.image || '',
            skills: data.profile.skills || [],
            interests: data.profile.interests || [],
            availability: data.profile.availability || '',
            bio: data.profile.bio || '',
          });
        } else if (data.userName) {
          setFormData((prev) => ({ ...prev, name: data.userName }));
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

  const addSkill = () => {
    if (skillInput.trim()) {
      setFormData({ ...formData, skills: [...(formData.skills || []), skillInput.trim()] });
      setSkillInput('');
    }
  };

  const removeSkill = (index: number) => {
    if (formData.skills) {
      const newSkills = [...formData.skills];
      newSkills.splice(index, 1);
      setFormData({ ...formData, skills: newSkills });
    }
  };

  const addInterest = () => {
    if (interestInput.trim()) {
      setFormData({ ...formData, interests: [...(formData.interests || []), interestInput.trim()] });
      setInterestInput('');
    }
  };

  const removeInterest = (index: number) => {
    if (formData.interests) {
      const newInterests = [...formData.interests];
      newInterests.splice(index, 1);
      setFormData({ ...formData, interests: newInterests });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      volunteerProfileSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setMessage('Validation failed: ' + error.issues[0].message);
        setSaving(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/profile/volunteer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Profile updated successfully!');
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
        <Link href="/dashboard/volunteer" className="text-brand-primary hover:text-brand-primary mb-4 inline-block text-sm">&larr; Back to Dashboard</Link>
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
        <h1 className="text-2xl font-bold mb-6">Volunteer Profile</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <label className="block text-gray-700 font-bold mb-2">Phone</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Skills</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                className="flex-1 p-2 border rounded"
                placeholder="Add a skill (e.g., Coding)"
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.skills?.map((skill, index) => (
                <span key={index} className="bg-blue-100 text-brand-primary px-3 py-1 rounded-full flex items-center">
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(index)}
                    className="ml-2 text-brand-primary hover:text-brand-primary"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Interests</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                className="flex-1 p-2 border rounded"
                placeholder="Add an interest (e.g., Education)"
              />
              <button
                type="button"
                onClick={addInterest}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.interests?.map((interest, index) => (
                <span key={index} className="bg-brand-accent-light text-green-800 px-3 py-1 rounded-full flex items-center">
                  {interest}
                  <button
                    type="button"
                    onClick={() => removeInterest(index)}
                    className="ml-2 text-brand-accent hover:text-green-800"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Availability</label>
            <textarea
              name="availability"
              value={formData.availability}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="e.g., Weekends, 5-7 PM"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              rows={4}
              placeholder="Tell us about yourself..."
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