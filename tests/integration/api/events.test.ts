import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { prisma } from '../../setup'
import jwt from 'jsonwebtoken'

const TEST_SECRET = process.env.JWT_SECRET || 'default-secret-key'

const mockCookieGet = vi.hoisted(() => vi.fn())
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ get: mockCookieGet }),
}))

import { GET, POST } from '@/app/api/events/route'
import {
  GET as eventGet,
  PATCH as eventPatch,
  DELETE as eventDelete,
} from '@/app/api/events/[eventId]/route'

function req(url: string, options?: RequestInit): Request {
  return new Request(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
}

let orgUserId: string
let orgProfileId: string
let orgToken: string
let volToken: string
let publishedEventId: string
let draftEventId: string

beforeAll(async () => {
  const ids = (await prisma.user.findMany({ where: { email: { contains: '@events.test' } }, select: { id: true } })).map(u => u.id)
  await prisma.volunteerApplication.deleteMany({ where: { volunteer: { userId: { in: ids } } } })
  await prisma.event.deleteMany({ where: { organization: { userId: { in: ids } } } })
  await prisma.volunteerProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.organizationProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.user.deleteMany({ where: { id: { in: ids } } })

  const { hashPassword } = await import('@/lib/auth')
  const hashed = await hashPassword('password')

  // Approved org user
  const orgUser = await prisma.user.create({
    data: { name: 'Event Org', email: 'org@events.test', password: hashed, role: 'ORGANIZATION', status: 'APPROVED' },
  })
  orgUserId = orgUser.id
  orgToken = jwt.sign({ userId: orgUser.id, role: 'ORGANIZATION' }, TEST_SECRET)

  const orgProfile = await prisma.organizationProfile.create({
    data: { userId: orgUser.id, organizationName: 'Event Org Inc', status: 'APPROVED' },
  })
  orgProfileId = orgProfile.id

  // Volunteer user (for non-org tests)
  const volUser = await prisma.user.create({
    data: { name: 'Event Vol', email: 'vol@events.test', password: hashed, role: 'VOLUNTEER', status: 'APPROVED' },
  })
  volToken = jwt.sign({ userId: volUser.id, role: 'VOLUNTEER' }, TEST_SECRET)

  // Published future event
  const publishedEvent = await prisma.event.create({
    data: {
      title: 'Community Cleanup',
      description: 'Clean the park',
      category: 'Environment',
      location: 'Central Park',
      startDate: new Date('2027-06-01T09:00:00Z'),
      endDate: new Date('2027-06-01T17:00:00Z'),
      requiredSkills: ['Cleaning', 'Gardening'],
      volunteerLimit: 10,
      status: 'PUBLISHED',
      organizationId: orgProfileId,
    },
  })
  publishedEventId = publishedEvent.id

  // Draft event (should not appear in listing)
  await prisma.event.create({
    data: {
      title: 'Draft Workshop',
      description: 'Draft description',
      category: 'Education',
      location: 'Online',
      startDate: new Date('2027-07-01T09:00:00Z'),
      endDate: new Date('2027-07-01T17:00:00Z'),
      requiredSkills: ['Teaching'],
      volunteerLimit: 5,
      status: 'DRAFT',
      organizationId: orgProfileId,
    },
  })
  draftEventId = 'placeholder'

  // Past event (should not appear in listing)
  await prisma.event.create({
    data: {
      title: 'Past Event',
      description: 'Already happened',
      category: 'Health',
      location: 'Hospital',
      startDate: new Date('2024-01-01T09:00:00Z'),
      endDate: new Date('2024-01-01T17:00:00Z'),
      requiredSkills: ['Medical'],
      volunteerLimit: 5,
      status: 'PUBLISHED',
      organizationId: orgProfileId,
    },
  })
})

afterAll(async () => {
  const ids = (await prisma.user.findMany({ where: { email: { contains: '@events.test' } }, select: { id: true } })).map(u => u.id)
  await prisma.volunteerApplication.deleteMany({ where: { volunteer: { userId: { in: ids } } } })
  await prisma.event.deleteMany({ where: { organization: { userId: { in: ids } } } })
  await prisma.volunteerProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.organizationProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.user.deleteMany({ where: { id: { in: ids } } })
})

describe('GET /api/events', () => {
  beforeEach(() => mockCookieGet.mockReset())

  it('returns only published future events', async () => {
    mockCookieGet.mockReturnValue(undefined)
    const res = await GET(req('http://localhost:3000/api/events'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.events.length).toBeGreaterThanOrEqual(1)
    expect(body.events[0].title).toBe('Community Cleanup')
    expect(body.events[0].status).toBe('PUBLISHED')
  })

  it('filters by category', async () => {
    mockCookieGet.mockReturnValue(undefined)
    const res = await GET(req('http://localhost:3000/api/events?category=Environment'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.events.length).toBe(1)
    expect(body.events[0].category).toBe('Environment')
  })

  it('filters by skills', async () => {
    mockCookieGet.mockReturnValue(undefined)
    const res = await GET(req('http://localhost:3000/api/events?skills=Gardening'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.events.length).toBe(1)
  })

  it('returns empty array for non-matching filter', async () => {
    mockCookieGet.mockReturnValue(undefined)
    const res = await GET(req('http://localhost:3000/api/events?category=Sports'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.events).toEqual([])
  })
})

describe('POST /api/events', () => {
  beforeEach(() => mockCookieGet.mockReset())

  const validEventBody = {
    title: 'New Test Event',
    description: 'Testing creation',
    category: 'Education',
    location: 'Test Location',
    startDate: '2027-08-01T09:00:00Z',
    endDate: '2027-08-01T17:00:00Z',
    volunteerLimit: 5,
  }

  it('org creates event returning 201', async () => {
    mockCookieGet.mockReturnValue({ value: orgToken })
    const res = await POST(req('http://localhost:3000/api/events', {
      method: 'POST',
      body: JSON.stringify(validEventBody),
    }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.event).toBeDefined()
    expect(body.event.title).toBe('New Test Event')
    expect(body.event.status).toBe('DRAFT')
  })

  it('non-org returns 403', async () => {
    mockCookieGet.mockReturnValue({ value: volToken })
    const res = await POST(req('http://localhost:3000/api/events', {
      method: 'POST',
      body: JSON.stringify(validEventBody),
    }))
    expect(res.status).toBe(403)
  })

  it('unauthenticated returns 401', async () => {
    mockCookieGet.mockReturnValue(undefined)
    const res = await POST(req('http://localhost:3000/api/events', {
      method: 'POST',
      body: JSON.stringify(validEventBody),
    }))
    expect(res.status).toBe(401)
  })

  it('invalid body returns 400', async () => {
    mockCookieGet.mockReturnValue({ value: orgToken })
    const res = await POST(req('http://localhost:3000/api/events', {
      method: 'POST',
      body: JSON.stringify({ title: 'Missing fields' }),
    }))
    expect(res.status).toBe(400)
  })
})

describe('GET /api/events/:id', () => {
  beforeEach(() => mockCookieGet.mockReset())

  it('returns full event detail', async () => {
    mockCookieGet.mockReturnValue(undefined)
    const res = await eventGet(req(`http://localhost:3000/api/events/${publishedEventId}`), {
      params: Promise.resolve({ eventId: publishedEventId }),
    } as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.event.title).toBe('Community Cleanup')
    expect(body.event.acceptedCount).toBe(0)
    expect(body.event.isFull).toBe(false)
  })

  it('returns 404 for non-existent event', async () => {
    mockCookieGet.mockReturnValue(undefined)
    const res = await eventGet(req('http://localhost:3000/api/events/nonexistent-id'), {
      params: Promise.resolve({ eventId: 'nonexistent-id' }),
    } as any)
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/events/:id', () => {
  beforeEach(() => mockCookieGet.mockReset())

  it('owner updates event', async () => {
    mockCookieGet.mockReturnValue({ value: orgToken })
    const res = await eventPatch(req('http://localhost:3000/api/events/' + publishedEventId, {
      method: 'PATCH',
      body: JSON.stringify({
        title: 'Updated Title',
        description: 'Updated description',
        category: 'Environment',
        location: 'Central Park',
        startDate: '2027-06-01T09:00:00Z',
        endDate: '2027-06-01T17:00:00Z',
        volunteerLimit: 10,
      }),
    }), { params: Promise.resolve({ eventId: publishedEventId }) } as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.event.title).toBe('Updated Title')
  })

  it('non-owner returns 403', async () => {
    mockCookieGet.mockReturnValue({ value: volToken })
    const res = await eventPatch(req('http://localhost:3000/api/events/' + publishedEventId, {
      method: 'PATCH',
      body: JSON.stringify({
        title: 'Hack Attempt',
        description: 'Hack',
        category: 'Environment',
        location: 'Central Park',
        startDate: '2027-06-01T09:00:00Z',
        endDate: '2027-06-01T17:00:00Z',
        volunteerLimit: 10,
      }),
    }), { params: Promise.resolve({ eventId: publishedEventId }) } as any)
    expect(res.status).toBe(403)
  })
})

describe('DELETE /api/events/:id', () => {
  let deletableEventId: string

  beforeAll(async () => {
    const event = await prisma.event.create({
      data: {
        title: 'Deletable Event',
        description: 'Will be deleted',
        category: 'Other',
        location: 'Nowhere',
        startDate: new Date('2027-09-01T09:00:00Z'),
        endDate: new Date('2027-09-01T17:00:00Z'),
        requiredSkills: [],
        volunteerLimit: 5,
        status: 'DRAFT',
        organizationId: orgProfileId,
      },
    })
    deletableEventId = event.id
  })

  beforeEach(() => mockCookieGet.mockReset())

  it('owner deletes event', async () => {
    mockCookieGet.mockReturnValue({ value: orgToken })
    const res = await eventDelete(req(`http://localhost:3000/api/events/${deletableEventId}`, {
      method: 'DELETE',
    }), { params: Promise.resolve({ eventId: deletableEventId }) } as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toBe('Event deleted successfully')

    const deleted = await prisma.event.findUnique({ where: { id: deletableEventId } })
    expect(deleted).toBeNull()
  })

  it('non-owner returns 403', async () => {
    mockCookieGet.mockReturnValue({ value: volToken })
    const res = await eventDelete(req(`http://localhost:3000/api/events/${publishedEventId}`, {
      method: 'DELETE',
    }), { params: Promise.resolve({ eventId: publishedEventId }) } as any)
    expect(res.status).toBe(403)
  })
})
