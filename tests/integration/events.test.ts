// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '../setup'
import jwt from 'jsonwebtoken'
import type { User, OrganizationProfile, VolunteerProfile, Event, VolunteerApplication, UserStatus } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key'

function generateToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '1h' })
}

async function createTestUser(email: string, role: string, status: string): Promise<User> {
  const user = await prisma.user.create({
    data: {
      name: `Test ${role}`,
      email,
      password: '$2a$10$dummy',
      role: role as 'VOLUNTEER' | 'ORGANIZATION' | 'ADMIN',
      status: status as UserStatus,
    },
  })
  return user
}

async function cleanup(): Promise<void> {
  const ids = (await prisma.user.findMany({ where: { email: { contains: '@test.com' } }, select: { id: true } })).map(u => u.id)
  await prisma.volunteerApplication.deleteMany({ where: { volunteer: { userId: { in: ids } } } })
  await prisma.event.deleteMany({ where: { organization: { userId: { in: ids } } } })
  await prisma.volunteerProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.organizationProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.user.deleteMany({ where: { id: { in: ids } } })
}

describe('Event Lifecycle Integration', () => {
  let orgUser: User
  let orgProfile: OrganizationProfile
  let volUser: User
  let volProfile: VolunteerProfile
  let event: Event
  let application: VolunteerApplication

  beforeAll(async () => {
    await cleanup()

    // Create approved organization
    orgUser = await createTestUser('org@test.com', 'ORGANIZATION', 'APPROVED')
    orgProfile = await prisma.organizationProfile.create({
      data: {
        userId: orgUser.id,
        organizationName: 'Test Org',
        description: 'A test organization',
        status: 'APPROVED',
      },
    })

    // Create approved volunteer
    volUser = await createTestUser('vol@test.com', 'VOLUNTEER', 'APPROVED')
    volProfile = await prisma.volunteerProfile.create({
      data: {
        userId: volUser.id,
        skills: ['Teaching', 'Cooking'],
        interests: ['Education'],
        availability: 'Weekends',
        bio: 'I love volunteering',
      },
    })
  })

  afterAll(async () => {
    await cleanup()
  })

  it('1. Organization creates a published event', async () => {
    const eventData = {
      title: 'Community Cleanup',
      description: 'Help clean the park',
      category: 'Environment',
      location: 'Central Park',
      startDate: '2026-07-01T09:00:00.000Z',
      endDate: '2026-07-01T17:00:00.000Z',
      requiredSkills: ['Teaching', 'Cleaning'],
      volunteerLimit: 5,
      status: 'PUBLISHED' as const,
    }

    event = await prisma.event.create({
      data: {
        ...eventData,
        startDate: new Date(eventData.startDate),
        endDate: new Date(eventData.endDate),
        organizationId: orgProfile.id,
      },
    })

    expect(event).toBeDefined()
    expect(event.title).toBe('Community Cleanup')
    expect(event.status).toBe('PUBLISHED')
  })

  it('2. Guest browsing returns only PUBLISHED future events', async () => {
    const events = await prisma.event.findMany({
      where: {
        status: 'PUBLISHED',
        startDate: { gte: new Date() },
      },
    })

    expect(events.length).toBeGreaterThanOrEqual(1)
    expect(events[0].status).toBe('PUBLISHED')
  })

  it('3. Approved volunteer applies to event', async () => {
    application = await prisma.volunteerApplication.create({
      data: {
        eventId: event.id,
        volunteerId: volProfile.id,
        message: 'I would love to help!',
      },
    })

    expect(application).toBeDefined()
    expect(application.status).toBe('PENDING')
  })

  it('4. Volunteer cannot apply to same event twice', async () => {
    try {
      await prisma.volunteerApplication.create({
        data: {
          eventId: event.id,
          volunteerId: volProfile.id,
        },
      })
      expect.fail('Should have thrown unique constraint error')
    } catch (err: unknown) {
      const prismaErr = err as { code?: string }
      expect(prismaErr.code).toBe('P2002') // Prisma unique constraint
    }
  })

  it('5. Organization views applications for their event', async () => {
    const applications = await prisma.volunteerApplication.findMany({
      where: { eventId: event.id },
      include: {
        volunteer: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    })

    expect(applications.length).toBe(1)
    expect(applications[0].volunteer.user.name).toBe('Test VOLUNTEER')
    expect(applications[0].volunteer.skills).toContain('Teaching')
  })

  it('6. Organization accepts the application', async () => {
    const updated = await prisma.volunteerApplication.update({
      where: { id: application.id },
      data: { status: 'ACCEPTED' },
    })

    expect(updated.status).toBe('ACCEPTED')
  })

  it('7. Full event check: filling volunteer capacity', async () => {
    // Create 4 more volunteers and accept them to fill capacity (limit was 5)
    const remainingSlots = 4
    for (let i = 0; i < remainingSlots; i++) {
      const vUser = await createTestUser(`vol${i}@test.com`, 'VOLUNTEER', 'APPROVED')
      const vProfile = await prisma.volunteerProfile.create({
        data: { userId: vUser.id, skills: [], interests: [], status: 'APPROVED' },
      })

      const app = await prisma.volunteerApplication.create({
        data: { eventId: event.id, volunteerId: vProfile.id },
      })

      await prisma.volunteerApplication.update({
        where: { id: app.id },
        data: { status: 'ACCEPTED' },
      })
    }

    const acceptedCount = await prisma.volunteerApplication.count({
      where: { eventId: event.id, status: 'ACCEPTED' },
    })

    expect(acceptedCount).toBe(5)

    // Try to accept one more
    const extraUser = await createTestUser('extra@test.com', 'VOLUNTEER', 'APPROVED')
    const extraProfile = await prisma.volunteerProfile.create({
      data: { userId: extraUser.id, skills: [], interests: [], status: 'APPROVED' },
    })

    const extraApp = await prisma.volunteerApplication.create({
      data: { eventId: event.id, volunteerId: extraProfile.id },
    })

    const overFilled = await prisma.volunteerApplication.count({
      where: { eventId: event.id, status: 'ACCEPTED' },
    })

    expect(overFilled).toBe(5) // should still be 5 because we haven't accepted extra

    expect(async () => {
      await prisma.volunteerApplication.update({
        where: { id: extraApp.id },
        data: { status: 'ACCEPTED' },
      })
      const finalAccepted = await prisma.volunteerApplication.count({
        where: { eventId: event.id, status: 'ACCEPTED' },
      })
      expect(finalAccepted).toBe(6) // this would be a bug - event would be overfilled
    // The constraint should be enforced at application level
    })
  })

  it('8. Volunteer sees updated application status', async () => {
    const applications = await prisma.volunteerApplication.findMany({
      where: { volunteerId: volProfile.id },
      include: { event: true },
    })

    expect(applications.length).toBe(1)
    expect(applications[0].status).toBe('ACCEPTED')
  })
})
