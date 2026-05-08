// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

import { cookies } from 'next/headers';
import { decodeToken } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function StatusPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    redirect('/login');
  }

  const decoded = decodeToken(token) as { userId: string; role: string } | null;
  if (!decoded?.userId) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { status: true, role: true },
  });

  if (!user) {
    redirect('/login');
  }

  if (user.status === 'APPROVED') {
    redirect('/dashboard/' + (user.role === 'ADMIN' ? 'admin' : user.role.toLowerCase()));
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8 text-black">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {user.status === 'PENDING' ? (
          <>
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined h-10 w-10 text-yellow-600">schedule</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Account Under Review</h1>
            <p className="text-gray-600 mb-6">
              Your account is currently under review. Please wait for an administrator to approve your account.
              This process may take a few hours.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              You will be able to access all features once your account is approved.
            </div>
          </>
        ) : user.status === 'REJECTED' ? (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined h-10 w-10 text-red-600">cancel</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Account Rejected</h1>
            <p className="text-gray-600 mb-6">
              Your account has been rejected. Please contact support for more information.
            </p>
            <a
              href="mailto:support@voluntry.com"
              className="inline-block bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 font-semibold transition-colors"
            >
              Contact Support
            </a>
          </>
        ) : user.status === 'SUSPENDED' ? (
          <>
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined h-10 w-10 text-gray-600">block</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Account Suspended</h1>
            <p className="text-gray-600 mb-6">
              Your account has been suspended. Please contact support for more information.
            </p>
            <a
              href="mailto:support@voluntry.com"
              className="inline-block bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 font-semibold transition-colors"
            >
              Contact Support
            </a>
          </>
        ) : null}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <a href="/login" className="text-sm text-gray-500 hover:text-gray-700">
            &larr; Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}