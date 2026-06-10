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
    if (!decoded || decoded.role !== 'ORGANIZATION') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = decoded.userId;

    // Check User-level approval status first
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true },
    });

    if (!user || user.status !== 'APPROVED') {
      const message = user?.status === 'REJECTED' 
        ? 'Your account has been rejected' 
        : 'Your account has not been approved yet';
      return NextResponse.json({ 
        error: message, 
        status: user?.status 
      }, { status: 403 });
    }

    // Get Profile
    const profile = await prisma.organizationProfile.findUnique({
      where: { userId },
      include: { user: true }
    });

    if (!profile) {
      return NextResponse.json({
        profile: null,
        events: [],
        eventStats: {},
        pendingApplications: []
      });
    }

    // Get Created Events
    const events = await prisma.event.findMany({
      where: { organizationId: profile.id },
      orderBy: { createdAt: 'desc' }
    });

    // Get Pending Applications for all events created by this org
    const pendingApplications = await prisma.volunteerApplication.findMany({
      where: {
        event: { organizationId: profile.id },
        status: 'PENDING'
      },
      include: {
        volunteer: { include: { user: true } },
        event: true
      },
      orderBy: { appliedAt: 'desc' }
    });

    // Calculate stats per event
    const eventStats = await Promise.all(events.map(async (event) => {
      const totalApps = await prisma.volunteerApplication.count({ where: { eventId: event.id } });
      const pendingApps = await prisma.volunteerApplication.count({ where: { eventId: event.id, status: 'PENDING' } });
      const acceptedApps = await prisma.volunteerApplication.count({ where: { eventId: event.id, status: 'ACCEPTED' } });
      
      return {
        eventId: event.id,
        totalApplications: totalApps,
        pending: pendingApps,
        accepted: acceptedApps
      };
    }));

    return NextResponse.json({
      profile,
      events,
      eventStats: eventStats.reduce((acc, stat) => {
        acc[stat.eventId] = { total: stat.totalApplications, pending: stat.pending, accepted: stat.accepted };
        return acc;
      }, {} as Record<string, { total: number; pending: number; accepted: number }>),
      pendingApplications
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}