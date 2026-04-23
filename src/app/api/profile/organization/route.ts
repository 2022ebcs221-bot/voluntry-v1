// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { organizationProfileSchema } from '@/lib/validations';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token) as { userId: string };

    const profile = await prisma.organizationProfile.findUnique({
      where: { userId: decoded.userId },
      include: { user: { select: { status: true } } },
    });

    if (!profile) {
      return NextResponse.json({ message: 'Profile not found', profile: null, status: null }, { status: 404 });
    }

    return NextResponse.json({ profile, status: profile.user.status });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token) as { userId: string };

    const body = await req.json();
    
    // Parse and validate the request body
    const validatedData = organizationProfileSchema.parse(body);

    // Ensure the user has a role of ORGANIZATION
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.role !== 'ORGANIZATION') {
      return NextResponse.json({ error: 'User is not an organization' }, { status: 403 });
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
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}