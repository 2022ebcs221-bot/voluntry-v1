// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthToken, decodeToken } from '@/lib/permissions';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = decodeToken(token) as { userId: string; role: string } | null;
    if (!decoded || decoded.role !== 'ORGANIZATION') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { eventId } = await params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        volunteerLimit: true,
        organization: { select: { userId: true } },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.organization.userId !== decoded.userId) {
      return NextResponse.json({ error: 'You do not own this event' }, { status: 403 });
    }

    const acceptedCount = await prisma.volunteerApplication.count({
      where: { eventId, status: 'ACCEPTED' },
    });

    const applications = await prisma.volunteerApplication.findMany({
      where: { eventId },
      include: {
        volunteer: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });

    return NextResponse.json({
      applications,
      event: { id: event.id, title: event.title, volunteerLimit: event.volunteerLimit },
      acceptedCount,
      isFull: acceptedCount >= event.volunteerLimit,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}