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

    const [pendingOrganizations, pendingVolunteers] = await Promise.all([
      prisma.organizationProfile.findMany({
        where: { status: 'PENDING' },
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.volunteerProfile.findMany({
        where: { status: 'PENDING' },
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);

    return NextResponse.json({
      pendingOrganizations,
      pendingVolunteers,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}