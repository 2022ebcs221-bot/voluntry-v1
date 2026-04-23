// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

import { cookies } from 'next/headers';
import { verifyToken } from './auth';
import { prisma } from '@/lib/prisma';

export type UserRole = 'ADMIN' | 'VOLUNTEER' | 'ORGANIZATION';

export function getDashboardPath(role: string): string {
  switch (role) {
    case 'ADMIN':
      return '/dashboard/admin';
    case 'VOLUNTEER':
      return '/dashboard/volunteer';
    case 'ORGANIZATION':
      return '/dashboard/organization';
    default:
      return '/';
  }
}

export function isAuthorized(userRole: string | undefined, allowedRoles: string[]): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

export async function getAuthToken() {
  const cookieStore = await cookies();
  return cookieStore.get('auth_token')?.value;
}

export function decodeToken(token: string) {
  try {
    return verifyToken(token);
  } catch (error) {
    return null;
  }
}

export async function isUserApproved(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true },
    });
    return user?.status === 'APPROVED';
  } catch {
    return false;
  }
}