// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthToken, decodeToken } from '@/lib/permissions';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = decodeToken(token) as { userId: string; role: string } | null;
    if (!decoded || decoded.role !== 'VOLUNTEER') {
      return NextResponse.json({ error: 'Only volunteers can apply' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { status: true },
    });

    if (!user || user.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Your account has not been approved yet' }, { status: 403 });
    }

    const volunteerProfile = await prisma.volunteerProfile.findUnique({
      where: { userId: decoded.userId },
    });

    if (!volunteerProfile) {
      return NextResponse.json({ error: 'Volunteer profile not found. Please create one first.' }, { status: 400 });
    }

    const { eventId } = await params;
    const body = await req.json();
    const { message, answers } = body;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        applications: {
          where: { status: 'ACCEPTED' },
          select: { id: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Event is not open for applications' }, { status: 400 });
    }

    if (event.applications.length >= event.volunteerLimit) {
      return NextResponse.json({ error: 'Event is full' }, { status: 400 });
    }

    const existingApplication = await prisma.volunteerApplication.findUnique({
      where: {
        eventId_volunteerId: {
          eventId,
          volunteerId: volunteerProfile.id,
        },
      },
    });

    if (existingApplication) {
      return NextResponse.json({ error: 'You have already applied to this event' }, { status: 409 });
    }

    const application = await prisma.volunteerApplication.create({
      data: {
        eventId,
        volunteerId: volunteerProfile.id,
        message: message || null,
        answers: answers || [],
      },
    });

    return NextResponse.json({ application, message: 'Application submitted successfully' }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}