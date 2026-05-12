// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { registerSchema } from '@/lib/validations';
import { ZodError } from 'zod';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role } = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'VOLUNTEER',
      },
    });

    // Auto-create the corresponding profile so admin can see pending users
    if (role === 'VOLUNTEER') {
      await prisma.volunteerProfile.create({
        data: {
          userId: user.id,
          skills: [],
          interests: [],
        },
      });
    } else if (role === 'ORGANIZATION') {
      await prisma.organizationProfile.create({
        data: {
          userId: user.id,
          organizationName: name,
        },
      });
    }

    return NextResponse.json({ message: 'User created successfully', userId: user.id }, { status: 201 });
  } catch (error) {
    console.error(error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}