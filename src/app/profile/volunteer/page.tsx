// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

'use client';

import { useState, useEffect } from 'react';
import { volunteerProfileSchema, VolunteerProfileFormData } from '@/lib/validations';
import { z } from 'zod';

export default function VolunteerProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [userStatus, setUserStatus] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<VolunteerProfileFormData>({
    phone: '',
    location: '',
    skills: [],
    interests: [],
    availability: '',
    bio: '',
  });

  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first');
      window.location.href = '/login';
      return;
    }

    fetch('/api/profile/volunteer', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setFormData({
            phone: data.profile.phone || '',
            location: data.profile.location || '',
            skills: data.profile.skills || [],
            interests: data.profile.interests || [],
            availability: data.profile.availability || '',
            bio: data.profile.bio || '',
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
        setMessage('Validation failed: ' + error.errors[0].message);
        setSaving(false);
        return;
      }
    }

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/profile/volunteer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
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
        <h1 className="text-2xl font-bold mb-6">Volunteer Profile</h1>
        
        <form onSubmit={handleSubmit}>
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
                <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center">
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(index)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
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
                <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center">
                  {interest}
                  <button
                    type="button"
                    onClick={() => removeInterest(index)}
                    className="ml-2 text-green-600 hover:text-green-800"
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