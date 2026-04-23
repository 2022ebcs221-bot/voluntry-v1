// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthToken, decodeToken } from '@/lib/permissions';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = decodeToken(token) as { userId: string; role: string } | null;
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
    }

    const { userId } = await params;
    const body = await req.json();
    const { status } = body;

    if (!userId || !status) {
      return NextResponse.json({ error: 'userId and status are required' }, { status: 400 });
    }

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be APPROVED or REJECTED' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: status as 'APPROVED' | 'REJECTED' },
    });

    if (targetUser.role === 'VOLUNTEER') {
      await prisma.volunteerProfile.update({
        where: { userId },
        data: { status },
      });
    } else if (targetUser.role === 'ORGANIZATION') {
      await prisma.organizationProfile.update({
        where: { userId },
        data: { status },
      });
    }

    return NextResponse.json({
      message: `User ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully`,
      userId,
      status,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}