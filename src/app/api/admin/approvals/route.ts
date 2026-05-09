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

    // Also include users who registered but have not yet created their profile
    const usersWithoutOrgProfile = await prisma.user.findMany({
      where: {
        role: 'ORGANIZATION',
        organizationProfile: null,
        status: 'PENDING',
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    const usersWithoutVolProfile = await prisma.user.findMany({
      where: {
        role: 'VOLUNTEER',
        volunteerProfile: null,
        status: 'PENDING',
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    const mergedPendingOrgs = [
      ...pendingOrganizations,
      ...usersWithoutOrgProfile.map((u) => ({
        id: u.id,
        userId: u.id,
        user: { name: u.name, email: u.email },
        createdAt: u.createdAt.toISOString(),
        organizationName: u.name,
      })),
    ];

    const mergedPendingVols = [
      ...pendingVolunteers,
      ...usersWithoutVolProfile.map((u) => ({
        id: u.id,
        userId: u.id,
        user: { name: u.name, email: u.email },
        createdAt: u.createdAt.toISOString(),
      })),
    ];

    return NextResponse.json({
      pendingOrganizations: mergedPendingOrgs,
      pendingVolunteers: mergedPendingVols,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}