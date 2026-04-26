// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface EventDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  startDate: string;
  endDate: string;
  requiredSkills: string[];
  volunteerLimit: number;
  status: string;
  image?: string;
  questions?: string[];
  organization: {
    id: string;
    organizationName?: string;
    user: { name: string };
  };
  acceptedCount: number;
  isFull: boolean;
  hasApplied: boolean;
}

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);
  const [applyMessage, setApplyMessage] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/events/${eventId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setEvent(data.event);
        }
      })
      .catch(() => setError('Failed to load event'))
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleApplyClick = () => {
    if (event?.questions && event.questions.length > 0) {
      setAnswers(new Array(event.questions.length).fill(''));
      setShowApplyForm(true);
    } else {
      submitApplication([]);
    }
  };

  const submitApplication = async (answersData: { question: string; answer: string }[]) => {
    setApplying(true);
    setApplyError(null);
    setShowApplyForm(false);

    try {
      const res = await fetch(`/api/events/${eventId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '', answers: answersData }),
      });
      const data = await res.json();
      if (res.ok) {
        setApplyMessage('Application submitted successfully!');
        setEvent((prev) => prev ? { ...prev, hasApplied: true } : prev);
      } else {
        setApplyError(data.error || 'Failed to apply');
      }
    } catch {
      setApplyError('Network error. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  const handleApplySubmit = () => {
    if (!event?.questions) return;
    const answersData = event.questions.map((q, i) => ({
      question: q,
      answer: answers[i] || '',
    }));
    submitApplication(answersData);
  };

  if (loading) return <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center"><p className="text-gray-500 text-lg">Loading event...</p></div>;
  if (error) return <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center"><p className="text-red-500 text-lg">Error: {error}</p></div>;
  if (!event) return null;

  const buttonDisabled = applying || event.hasApplied || event.isFull;

  const getButtonText = () => {
    if (event.hasApplied) return 'Already Applied';
    if (event.isFull) return 'Event Full';
    if (applying) return 'Applying...';
    return 'Apply Now';
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-3xl mx-auto">
        <Link href="/events" className="text-brand-primary hover:text-brand-primary mb-4 inline-block">&larr; Back to Events</Link>

        <div className="bg-white rounded-lg shadow p-8">
          <div className="mb-6">
            <img 
              src={event.image || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=800&auto=format&fit=crop'} 
              alt={event.title} 
              className="w-full aspect-video object-cover rounded-lg" 
            />
          </div>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>
              <p className="text-brand-primary font-medium">{event.category}</p>
              <p className="text-sm text-gray-500 mt-1">
                Organized by {event.organization?.organizationName || event.organization?.user?.name || 'Unknown'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-medium">{event.location}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-500 uppercase">Start</p>
              <p className="font-medium">{new Date(event.startDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">End</p>
              <p className="font-medium">{new Date(event.endDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Volunteers Needed</p>
              <p className="font-medium">{event.acceptedCount} / {event.volunteerLimit} accepted</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Status</p>
              <p className="font-medium">{event.status}</p>
            </div>
           </div>
 
           {event.requiredSkills.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-700 mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {event.requiredSkills.map((skill, i) => (
                  <span key={i} className="bg-blue-100 text-brand-primary px-3 py-1 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mb-8">
            <h3 className="text-sm font-bold text-gray-700 mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
          </div>

          {applyMessage && (
            <div className="mb-4 p-4 bg-brand-accent-light text-green-800 rounded border border-green-300">
              {applyMessage}
            </div>
          )}
          {applyError && (
            <div className="mb-4 p-4 bg-red-100 text-red-800 rounded border border-red-300">
              {applyError}
            </div>
          )}

          {showApplyForm && event.questions && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <h3 className="font-bold text-lg mb-4">Answer these questions</h3>
              {event.questions.map((q, i) => (
                <div key={i} className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-1">{q}</label>
                  <textarea
                    value={answers[i] || ''}
                    onChange={(e) => { const a = [...answers]; a[i] = e.target.value; setAnswers(a); }}
                    rows={2}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              ))}
              <div className="flex gap-3">
                <button onClick={handleApplySubmit} disabled={applying} className="bg-brand-primary text-white py-2 px-6 rounded font-medium hover:bg-brand-primary-hover disabled:opacity-50">
                  {applying ? 'Submitting...' : 'Submit Application'}
                </button>
                <button onClick={() => setShowApplyForm(false)} className="bg-gray-200 text-gray-700 py-2 px-6 rounded font-medium hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {event.status === 'PUBLISHED' && !showApplyForm && (
            <button
              onClick={handleApplyClick}
              disabled={buttonDisabled}
              className={`w-full py-3 rounded-xl font-bold text-lg transition-colors ${
                buttonDisabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-brand-primary text-white hover:bg-brand-primary-hover'
              }`}
            >
              {getButtonText()}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}