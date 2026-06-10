'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const DASHBOARD_ROUTES: Record<string, string> = {
  ADMIN: '/dashboard/admin',
  ORGANIZATION: '/dashboard/organization',
  VOLUNTEER: '/dashboard/volunteer',
};

interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  startDate: string;
  requiredSkills: string[];
  image?: string;
  match: boolean;
  organization: {
    user: { name: string };
  };
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [showSkillsDropdown, setShowSkillsDropdown] = useState(false);
  const skillsDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.role) {
          window.location.href = '/login';
          return;
        }
        setRole(data.role);
      })
      .catch(() => {
        window.location.href = '/login';
      })
      .finally(() => setCheckingAuth(false));
  }, []);

  useEffect(() => {
    fetch('/api/events/filters')
      .then((res) => res.json())
      .then((data) => {
        setAvailableCategories(data.categories || []);
        setAvailableSkills(data.skills || []);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (skillsDropdownRef.current && !skillsDropdownRef.current.contains(e.target as Node)) {
        setShowSkillsDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchEvents = (searchKeyword?: string, searchCategory?: string, searchSkills?: string[]) => {
    const params = new URLSearchParams();
    if (searchKeyword) params.set('q', searchKeyword);
    if (searchCategory) params.set('category', searchCategory);
    if (searchSkills && searchSkills.length > 0) params.set('skills', searchSkills.join(','));

    fetch(`/api/events?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.events || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchEvents(keyword, category, selectedSkills);
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  if (checkingAuth) return null;

  const dashboardHref = role ? DASHBOARD_ROUTES[role] || '/login' : null;

  return (
    <div className="min-h-screen bg-gray-100 text-black">
      {dashboardHref && (
        <Link
          href={dashboardHref}
          className="inline-block text-brand-primary hover:text-brand-primary-hover font-medium text-sm px-8 pt-4"
        >
          &larr; Back to Dashboard
        </Link>
      )}
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Discover Events</h1>

        {/* Search/Filter Bar */}
        <form onSubmit={handleSearch} className="bg-white p-4 rounded-lg shadow mb-8 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search events..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500"
          />

          {/* Category Dropdown */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Categories</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Skills Multi-Select Dropdown */}
          <div className="flex-1 relative" ref={skillsDropdownRef}>
            <button
              type="button"
              onClick={() => setShowSkillsDropdown(!showSkillsDropdown)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-white text-left flex justify-between items-center"
            >
              <span className={selectedSkills.length === 0 ? 'text-gray-500' : ''}>
                {selectedSkills.length === 0
                  ? 'All Skills'
                  : `${selectedSkills.length} skill${selectedSkills.length > 1 ? 's' : ''} selected`}
              </span>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showSkillsDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
                {availableSkills.map((skill) => (
                  <label
                    key={skill}
                    className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSkills.includes(skill)}
                      onChange={() => toggleSkill(skill)}
                      className="mr-2 rounded"
                    />
                    {skill}
                  </label>
                ))}
                {availableSkills.length === 0 && (
                  <p className="px-3 py-2 text-gray-500 text-sm">No skills available</p>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="bg-brand-primary text-white px-6 py-2 rounded hover:bg-brand-primary-hover font-medium"
          >
            Search
          </button>
        </form>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No upcoming events found.</p>
            <p className="text-gray-400 mt-2">Try adjusting your filters or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow flex flex-col overflow-hidden">
                {event.image && (
                  <img src={event.image} alt={event.title} className="w-full aspect-video object-cover" />
                )}
                <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-xl font-bold text-gray-900">{event.title}</h2>
                  {event.match && (
                    <span className="bg-brand-accent-light text-green-800 text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap">
                      Skills Match
                    </span>
                  )}
                </div>
                <p className="text-sm text-brand-primary font-medium mb-1">{event.category}</p>
                <p className="text-sm text-gray-500 mb-1">{event.location}</p>
                <p className="text-sm text-gray-500 mb-1">
                  {new Date(event.startDate).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                  })}
                </p>
                <p className="text-xs text-gray-400 mb-4">by {event.organization?.user?.name || 'Unknown'}</p>
                <div className="mt-auto">
                  <a
                    href={`/events/${event.id}`}
                    className="block text-center bg-brand-primary text-white py-2 rounded hover:bg-brand-primary-hover font-medium"
                  >
                    View Details
                  </a>
                </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
