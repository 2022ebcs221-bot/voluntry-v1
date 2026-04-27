// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthToken, decodeToken } from '@/lib/permissions';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status || !['ACCEPTED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Status must be ACCEPTED or REJECTED' }, { status: 400 });
    }

    const application = await prisma.volunteerApplication.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            organization: { select: { userId: true } },
            volunteerLimit: true,
            applications: { where: { status: 'ACCEPTED' }, select: { id: true } },
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.event.organization.userId !== decoded.userId) {
      return NextResponse.json({ error: 'You do not own this event' }, { status: 403 });
    }

    if (status === 'ACCEPTED' && application.event.applications.length >= application.event.volunteerLimit) {
      return NextResponse.json({ error: 'Event is already full' }, { status: 400 });
    }

    const updated = await prisma.volunteerApplication.update({
      where: { id },
      data: { status: status as 'ACCEPTED' | 'REJECTED' },
      include: {
        volunteer: {
          include: { user: { select: { name: true, email: true } } },
        },
        event: { select: { title: true } },
      },
    });

    return NextResponse.json({
      application: updated,
      message: `Application ${status === 'ACCEPTED' ? 'accepted' : 'rejected'} successfully`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}