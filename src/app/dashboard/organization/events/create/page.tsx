// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { eventSchema, EventFormData } from '@/lib/validations';
import Link from 'next/link';

export default function CreateEventPage() {
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema) as any,
  });

  const imageUrl = watch('image');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [skillsInput, setSkillsInput] = useState('');
  const [questionsList, setQuestionsList] = useState<string[]>([]);

  const addQuestion = () => setQuestionsList([...questionsList, '']);
  const removeQuestion = (idx: number) => setQuestionsList(questionsList.filter((_, i) => i !== idx));
  const updateQuestion = (idx: number, val: string) => {
    const updated = [...questionsList];
    updated[idx] = val;
    setQuestionsList(updated);
  };

  const onSubmit = async (data: EventFormData) => {
    setSubmitStatus('loading');
    setMessage('');
    const skills = skillsInput.split(',').map((s) => s.trim()).filter(Boolean);
    const payload = { ...data, requiredSkills: skills, questions: questionsList.filter((q) => q.trim()) };

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const response = await res.json();

      if (res.ok) {
        setSubmitStatus('success');
        setMessage('Event created successfully! You can now manage it.');
        // Reset form
        // Optionally redirect after delay
      } else {
        setSubmitStatus('error');
        setMessage(response.error || 'Failed to create event');
      }
    } catch {
      setSubmitStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard/organization" className="text-brand-primary hover:text-brand-primary mb-4 inline-block text-sm">{'\u2190'} Back to Dashboard</Link>
        <div className="bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Create New Event</h1>

        {message && (
          <div
            className={`mb-6 p-4 rounded ${
              submitStatus === 'error'
                ? 'bg-red-100 text-red-800 border border-red-300'
                : 'bg-brand-accent-light text-green-800 border border-green-300'
            }`}
          >
            {message}
            {submitStatus === 'success' && (
              <a href="/dashboard/organization/events" className="ml-2 underline">
                View all events
              </a>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-bold mb-2">Title</label>
            <input
              {...register('title')}
              type="text"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2">Description</label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-bold mb-2">Category</label>
              <input
                {...register('category')}
                type="text"
                placeholder="e.g., Education, Health"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2">Location</label>
              <input
                {...register('location')}
                type="text"
                placeholder="City, Venue"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-bold mb-2">Start Date & Time</label>
              <input
                {...register('startDate')}
                type="datetime-local"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>}
            </div>

            <div>
              <label className="block text-gray-700 font-bold mb-2">End Date & Time</label>
              <input
                {...register('endDate')}
                type="datetime-local"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2">Required Skills (comma separated)</label>
            <div>
              <input
                type="text"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="e.g., Teaching, Cooking, Singing"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2">Volunteer Limit</label>
            <input
              {...register('volunteerLimit')}
              type="number"
              min={1}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.volunteerLimit && <p className="text-red-500 text-sm mt-1">{errors.volunteerLimit.message}</p>}
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2">Status</label>
            <select
              {...register('status')}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2">Application Questions</label>
            <p className="text-sm text-gray-500 mb-2">Questions volunteers must answer when applying (optional).</p>
            {questionsList.map((q, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={q}
                  onChange={(e) => updateQuestion(i, e.target.value)}
                  placeholder={`Question ${i + 1}`}
                  className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button type="button" onClick={() => removeQuestion(i)} className="text-red-600 hover:text-red-800 px-2">X</button>
              </div>
            ))}
            <button type="button" onClick={addQuestion} className="text-brand-primary hover:text-brand-primary text-sm font-medium">+ Add Question</button>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2">Event Image</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                const data = await res.json();
                if (data.url) {
                  setValue('image', data.url);
                  setPreviewImage(data.url);
                }
              }}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {previewImage && (
              <img src={previewImage} alt="Preview" className="mt-2 h-32 w-auto rounded" />
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitStatus === 'loading'}
              className="bg-brand-primary text-white py-2 px-6 rounded font-medium hover:bg-brand-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitStatus === 'loading' ? 'Creating...' : 'Create Event'}
            </button>
            <Link
              href="/dashboard/organization/events"
              className="bg-gray-200 text-gray-700 py-2 px-6 rounded font-medium hover:bg-gray-300 self-center"
            >
              Cancel
            </Link>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}