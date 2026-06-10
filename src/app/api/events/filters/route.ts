import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      where: { status: 'PUBLISHED' },
      select: { category: true, requiredSkills: true },
    });

    const categorySet = new Set<string>();
    const skillSet = new Set<string>();

    for (const event of events) {
      categorySet.add(event.category);
      for (const skill of event.requiredSkills) {
        skillSet.add(skill);
      }
    }

    return NextResponse.json({
      categories: Array.from(categorySet).sort(),
      skills: Array.from(skillSet).sort(),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
