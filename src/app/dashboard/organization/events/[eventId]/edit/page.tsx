// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function EditEventPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    startDate: '',
    endDate: '',
    requiredSkills: '',
    volunteerLimit: 1,
    image: '',
    status: 'DRAFT' as const,
    questions: [] as string[],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`/api/events/${eventId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.event) {
          const e = data.event;
          setForm({
            title: e.title || '',
            description: e.description || '',
            category: e.category || '',
            location: e.location || '',
            startDate: e.startDate ? e.startDate.slice(0, 16) : '',
            endDate: e.endDate ? e.endDate.slice(0, 16) : '',
            requiredSkills: e.requiredSkills?.join(', ') || '',
            volunteerLimit: e.volunteerLimit || 1,
            image: e.image || '',
            status: e.status || 'DRAFT',
            questions: e.questions || [],
          });
        } else {
          setMessage('Event not found');
        }
      })
      .catch(() => setMessage('Failed to load event'))
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const payload = {
      ...form,
      requiredSkills: form.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean),
      volunteerLimit: Number(form.volunteerLimit),
      questions: form.questions.filter((q) => q.trim()),
    };

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Event updated successfully!');
      } else {
        setMessage(data.error || 'Failed to update event');
      }
    } catch {
      setMessage('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center text-black"><p>Loading event...</p></div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard/organization/events" className="text-brand-primary hover:text-brand-primary mb-4 inline-block text-sm">&larr; Back to Events</Link>
        <div className="bg-white p-8 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-6">Edit Event</h1>

          {message && (
            <div className={`mb-6 p-4 rounded ${message.includes('successfully') ? 'bg-brand-accent-light text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-bold mb-2">Title</label>
              <input type="text" name="title" value={form.title} onChange={handleChange} className="w-full p-2 border rounded" required />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={4} className="w-full p-2 border rounded" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-bold mb-2">Category</label>
                <input type="text" name="category" value={form.category} onChange={handleChange} className="w-full p-2 border rounded" required />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">Location</label>
                <input type="text" name="location" value={form.location} onChange={handleChange} className="w-full p-2 border rounded" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-bold mb-2">Start Date</label>
                <input type="datetime-local" name="startDate" value={form.startDate} onChange={handleChange} className="w-full p-2 border rounded" required />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">End Date</label>
                <input type="datetime-local" name="endDate" value={form.endDate} onChange={handleChange} className="w-full p-2 border rounded" required />
              </div>
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2">Required Skills (comma separated)</label>
              <input type="text" name="requiredSkills" value={form.requiredSkills} onChange={handleChange} className="w-full p-2 border rounded" placeholder="e.g., Teaching, Cooking" />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2">Volunteer Limit</label>
              <input type="number" name="volunteerLimit" value={form.volunteerLimit} onChange={handleChange} min={1} className="w-full p-2 border rounded" required />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="w-full p-2 border rounded">
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2">Application Questions</label>
              <p className="text-sm text-gray-500 mb-2">Questions volunteers must answer when applying.</p>
              {form.questions.map((q, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input type="text" value={q} onChange={(e) => { const u = [...form.questions]; u[i] = e.target.value; setForm({ ...form, questions: u }); }} placeholder={`Question ${i + 1}`} className="flex-1 p-2 border rounded" />
                  <button type="button" onClick={() => setForm({ ...form, questions: form.questions.filter((_, idx) => idx !== i) })} className="text-red-600 hover:text-red-800 px-2">X</button>
                </div>
              ))}
              <button type="button" onClick={() => setForm({ ...form, questions: [...form.questions, ''] })} className="text-brand-primary hover:text-brand-primary text-sm font-medium">+ Add Question</button>
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2">Event Image</label>
              <div className="flex items-center gap-4">
                {form.image ? (
                  <img src={form.image} alt="Event" className="w-24 h-16 rounded object-cover border" />
                ) : (
                  <div className="w-24 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-400 border text-xs">No Image</div>
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
                      if (res.ok) setForm((prev) => ({ ...prev, image: data.url }));
                    } catch {}
                  }}
                  className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-brand-primary-hover hover:file:bg-blue-100"
                />
                {form.image && (
                  <button type="button" onClick={() => setForm((prev) => ({ ...prev, image: '' }))} className="text-red-600 text-sm hover:text-red-800">
                    Remove
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-4">
              <button type="submit" disabled={saving} className="bg-brand-primary text-white py-2 px-6 rounded font-medium hover:bg-brand-primary-hover disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <Link href="/dashboard/organization/events" className="bg-gray-200 text-gray-700 py-2 px-6 rounded font-medium hover:bg-gray-300 self-center">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}