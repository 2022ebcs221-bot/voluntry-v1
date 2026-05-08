// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

import { NextResponse } from 'next/server';
import { getAuthToken, decodeToken } from '@/lib/permissions';

export async function GET() {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ role: null }, { status: 200 });
    }

    const decoded = decodeToken(token) as { userId: string; role: string } | null;
    if (!decoded) {
      return NextResponse.json({ role: null }, { status: 200 });
    }

    return NextResponse.json({ role: decoded.role }, { status: 200 });
  } catch {
    return NextResponse.json({ role: null }, { status: 200 });
  }
}
