// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthToken, decodeToken } from '@/lib/permissions';
import { eventSchema } from '@/lib/validations';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organization: {
          include: { user: { select: { name: true } } },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const acceptedCount = await prisma.volunteerApplication.count({
      where: { eventId, status: 'ACCEPTED' },
    });
    const isFull = acceptedCount >= event.volunteerLimit;

    let hasApplied = false;

    const token = await getAuthToken();
    if (token) {
      const decoded = decodeToken(token) as { userId: string; role: string } | null;
      if (decoded?.role === 'VOLUNTEER') {
        const volunteerProfile = await prisma.volunteerProfile.findUnique({
          where: { userId: decoded.userId },
          select: { id: true },
        });
        if (volunteerProfile) {
          const application = await prisma.volunteerApplication.findUnique({
            where: { eventId_volunteerId: { eventId, volunteerId: volunteerProfile.id } },
          });
          hasApplied = !!application;
        }
      }
    }

    return NextResponse.json({
      event: { ...event, acceptedCount, isFull, hasApplied },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
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
      select: { organization: { select: { userId: true } } },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.organization.userId !== decoded.userId) {
      return NextResponse.json({ error: 'You do not own this event' }, { status: 403 });
    }

    const body = await req.json();
    const validData = eventSchema.parse(body);

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: {
        title: validData.title,
        description: validData.description,
        category: validData.category,
        location: validData.location,
        startDate: new Date(validData.startDate),
        endDate: new Date(validData.endDate),
        requiredSkills: validData.requiredSkills,
        volunteerLimit: validData.volunteerLimit,
        image: validData.image,
        questions: validData.questions,
        status: validData.status,
      },
    });

    return NextResponse.json({ event: updated, message: 'Event updated successfully' });
  } catch (error) {
    console.error(error);
    const err = error as { name?: string; errors?: unknown[] };
    if (err.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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
      select: { organization: { select: { userId: true } } },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.organization.userId !== decoded.userId) {
      return NextResponse.json({ error: 'You do not own this event' }, { status: 403 });
    }

    await prisma.volunteerApplication.deleteMany({ where: { eventId } });
    await prisma.event.delete({ where: { id: eventId } });

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}