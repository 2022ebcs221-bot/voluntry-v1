import { cookies } from 'next/headers';
import { verifyToken } from './auth';

export type UserRole = 'ADMIN' | 'VOLUNTEER' | 'ORGANIZATION';

export function getDashboardPath(role: string): string {
  switch (role) {
    case 'ADMIN':
      return '/dashboard/admin';
    case 'VOLUNTEER':
      return '/profile/volunteer';
    case 'ORGANIZATION':
      return '/profile/organization';
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