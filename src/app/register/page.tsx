// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'volunteer') {
      router.push('/register/volunteer');
    } else if (role === 'organization') {
      router.push('/register/organization');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-black">
      <Navbar />
      <div className="flex items-center justify-center pt-16 pb-8">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Register</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Select Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="">Select a role</option>
              <option value="volunteer">Volunteer</option>
              <option value="organization">Organization</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Continue
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Already have an account? <a href="/login" className="text-brand-primary hover:text-brand-primary-hover">Login</a>
        </p>
      </div>
      </div>
    </div>
  );
}