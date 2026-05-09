// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthToken, decodeToken } from '@/lib/permissions';

export async function GET(req: Request) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = decodeToken(token) as { userId: string; role: string } | null;
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
    }

    const [
      approvedVolunteers,
      approvedOrganizations,
      activeEvents,
      pendingOrgApprovals,
      pendingVolunteerVerifications,
      rejectedVolunteers,
      rejectedOrganizations,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'VOLUNTEER', status: 'APPROVED' } }),
      prisma.user.count({ where: { role: 'ORGANIZATION', status: 'APPROVED' } }),
      prisma.event.count({ where: { status: 'PUBLISHED' } }),
      prisma.organizationProfile.count({ where: { status: 'PENDING' } }),
      prisma.volunteerProfile.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { role: 'VOLUNTEER', status: 'REJECTED' } }),
      prisma.user.count({ where: { role: 'ORGANIZATION', status: 'REJECTED' } }),
    ]);

    return NextResponse.json({
      totalVolunteers: approvedVolunteers,
      totalOrganizations: approvedOrganizations,
      activeEvents,
      pendingOrgApprovals,
      pendingVolunteerVerifications,
      rejectedVolunteers,
      rejectedOrganizations,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}