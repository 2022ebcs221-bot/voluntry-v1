// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthToken, decodeToken } from '@/lib/permissions';
import { eventSchema } from '@/lib/validations';
import { Prisma } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const skillsParam = searchParams.get('skills');

    const where: Prisma.EventWhereInput = {
      status: 'PUBLISHED',
      startDate: { gte: new Date() },
    };

    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }

    if (skillsParam) {
      const skills = skillsParam.split(',').map((s) => s.trim()).filter(Boolean);
      if (skills.length > 0) {
        where.requiredSkills = { hasSome: skills };
      }
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        organization: {
          include: { user: { select: { name: true } } }
        }
      },
      orderBy: { startDate: 'asc' }
    });

    // If logged-in volunteer, add match flag
    let userSkills: string[] = [];
    const token = await getAuthToken();
    if (token) {
      const decoded = decodeToken(token) as { userId: string; role: string } | null;
      if (decoded?.role === 'VOLUNTEER') {
        const profile = await prisma.volunteerProfile.findUnique({
          where: { userId: decoded.userId },
          select: { skills: true },
        });
        if (profile) {
          userSkills = profile.skills || [];
        }
      }
    }

    const eventsWithMatch = events.map((event) => ({
      ...event,
      match: userSkills.length > 0 && event.requiredSkills.some((s) => userSkills.includes(s)),
    }));

    return NextResponse.json({ events: eventsWithMatch });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = decodeToken(token) as { userId: string; role: string } | null;
    if (!decoded || decoded.role !== 'ORGANIZATION') {
      return NextResponse.json({ error: 'Forbidden: Organizations only' }, { status: 403 });
    }

    const orgProfile = await prisma.organizationProfile.findUnique({
      where: { userId: decoded.userId },
    });

    if (!orgProfile || orgProfile.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Organization not approved' }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = eventSchema.parse(body);

    const event = await prisma.event.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category,
        location: validatedData.location,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        requiredSkills: validatedData.requiredSkills,
        volunteerLimit: validatedData.volunteerLimit,
        status: validatedData.status,
        organizationId: orgProfile.id,
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}