// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
    }

    const [
      totalVolunteers,
      totalOrganizations,
      activeEvents,
      pendingOrgApprovals,
      pendingVolunteerVerifications,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'VOLUNTEER' } }),
      prisma.user.count({ where: { role: 'ORGANIZATION' } }),
      prisma.event.count({ where: { status: 'PUBLISHED' } }),
      prisma.organizationProfile.count({ where: { status: 'PENDING' } }),
      prisma.volunteerProfile.count({ where: { status: 'PENDING' } }),
    ]);

    return NextResponse.json({
      totalVolunteers,
      totalOrganizations,
      activeEvents,
      pendingOrgApprovals,
      pendingVolunteerVerifications,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}