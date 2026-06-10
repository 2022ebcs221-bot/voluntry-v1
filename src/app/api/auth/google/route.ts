// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth';
import { z } from 'zod';

const googleClient = new OAuth2Client();

const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'ID token is required'),
  role: z.enum(['VOLUNTEER', 'ORGANIZATION']).default('VOLUNTEER'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { idToken, role } = googleAuthSchema.parse(body);

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 });
    }

    const googleId = payload.sub;
    const email = payload.email!;
    const name = payload.name || '';
    const picture = payload.picture || '';

    // Find existing user by Google provider ID
    let user = await prisma.user.findFirst({
      where: { provider: 'google', providerId: googleId },
    });

    if (!user) {
      // Check if email already exists (link account)
      user = await prisma.user.findUnique({ where: { email } });

      if (user) {
        // Link Google account to existing user
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            provider: 'google',
            providerId: googleId,
            image: user.image || picture,
          },
        });
      } else {
        // Create new user (auto-approved since Google verifies email)
        user = await prisma.user.create({
          data: {
            name,
            email,
            provider: 'google',
            providerId: googleId,
            image: picture,
            role,
            status: 'APPROVED',
          },
        });

        // Auto-create profile
        if (role === 'VOLUNTEER') {
          await prisma.volunteerProfile.create({
            data: {
              userId: user.id,
              skills: [],
              interests: [],
              image: picture,
              status: 'APPROVED',
            },
          });
        } else {
          await prisma.organizationProfile.create({
            data: {
              userId: user.id,
              organizationName: name,
              image: picture,
              status: 'APPROVED',
            },
          });
        }
      }
    }

    const token = generateToken(user.id, user.role);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Google auth error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
