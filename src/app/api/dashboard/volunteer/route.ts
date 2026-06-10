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
    if (!decoded || decoded.role !== 'VOLUNTEER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userStatus = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { status: true },
    });

    if (!userStatus || userStatus.status !== 'APPROVED') {
      const message = userStatus?.status === 'REJECTED' 
        ? 'Your account has been rejected' 
        : 'Your account has not been approved yet';
      return NextResponse.json({ 
        error: message, 
        status: userStatus?.status 
      }, { status: 403 });
    }

    const userId = decoded.userId;

    // Get Profile
    const profile = await prisma.volunteerProfile.findUnique({
      where: { userId },
      include: { user: true }
    });

    // Calculate Profile Completion
    let completionPercentage = 0;
    if (profile) {
      const fields = [profile.phone, profile.location, profile.bio, profile.availability];
      const filledFields = fields.filter(f => f && f.length > 0).length;
      // skills and interests are arrays, checking if they exist and have length
      const hasSkills = profile.skills && profile.skills.length > 0;
      const hasInterests = profile.interests && profile.interests.length > 0;
      
      const totalFields = 6; // phone, location, bio, availability, skills, interests
      const filled = (filledFields + (hasSkills ? 1 : 0) + (hasInterests ? 1 : 0));
      completionPercentage = Math.round((filled / totalFields) * 100);
    }

    // Get Applied Events
    const applications = await prisma.volunteerApplication.findMany({
      where: { volunteer: { userId } },
      include: {
        event: true
      },
      orderBy: { appliedAt: 'desc' }
    });

    // Get Recommended Events (Simple Logic: Published events matching skills/interests)
    let recommendedEvents = [];
    if (profile && (profile.skills.length > 0 || profile.interests.length > 0)) {
      recommendedEvents = await prisma.event.findMany({
        where: {
          status: 'PUBLISHED',
          startDate: { gte: new Date() }, // Future events
          OR: [
            { requiredSkills: { hasSome: profile.skills } },
            { category: { in: profile.interests } }
          ]
        },
        take: 5,
        orderBy: { startDate: 'asc' }
      });
    } else {
      // Default: just show latest published events
      recommendedEvents = await prisma.event.findMany({
        where: { status: 'PUBLISHED', startDate: { gte: new Date() } },
        take: 5,
        orderBy: { startDate: 'asc' }
      });
    }

    return NextResponse.json({
      profile: {
        ...profile,
        completionPercentage
      },
      applications,
      recommendedEvents
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}