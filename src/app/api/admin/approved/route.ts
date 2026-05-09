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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [approvedVolunteers, approvedOrganizations] = await Promise.all([
      prisma.volunteerProfile.findMany({
        where: { status: 'APPROVED' },
        include: { user: { select: { name: true, email: true, status: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      }),
      prisma.organizationProfile.findMany({
        where: { status: 'APPROVED' },
        include: { user: { select: { name: true, email: true, status: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      }),
    ]);

    return NextResponse.json({
      approvedVolunteers,
      approvedOrganizations,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}