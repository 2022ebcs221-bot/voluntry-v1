// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthToken, decodeToken } from '@/lib/permissions';
import { organizationProfileSchema } from '@/lib/validations';

export async function GET(req: Request) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = decodeToken(token) as { userId: string };
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.organizationProfile.findUnique({
      where: { userId: decoded.userId },
      include: { user: { select: { name: true, status: true } } },
    });

    if (!profile) {
      return NextResponse.json({ message: 'Profile not found', profile: null, status: null, userName: null }, { status: 404 });
    }

    return NextResponse.json({ profile, status: profile.user.status, userName: profile.user.name });
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

    const decoded = decodeToken(token) as { userId: string };
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { userName: newName, ...profileFields } = body;
    
    // Parse and validate the request body (exclude userName from profile validation)
    const validatedData = organizationProfileSchema.parse(profileFields);

    // Ensure the user has a role of ORGANIZATION
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.role !== 'ORGANIZATION') {
      return NextResponse.json({ error: 'User is not an organization' }, { status: 403 });
    }

    // Update user name if provided
    if (newName && newName.trim() !== '') {
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { name: newName.trim() },
      });
    }

    // Upsert the profile - default status PENDING
    const profile = await prisma.organizationProfile.upsert({
      where: { userId: decoded.userId },
      update: validatedData,
      create: {
        userId: decoded.userId,
        ...validatedData,
        status: 'PENDING', // Default status requires admin approval
      },
    });

    return NextResponse.json({ message: 'Profile updated successfully', profile }, { status: 200 });
  } catch (error: unknown) {
    console.error(error);
    const err = error as { name?: string; errors?: unknown[] };
    if (err.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}