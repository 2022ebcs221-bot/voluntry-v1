import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { prisma } from '../../setup'
import jwt from 'jsonwebtoken'

const TEST_SECRET = process.env.JWT_SECRET || 'default-secret-key'

const mockCookieGet = vi.hoisted(() => vi.fn())
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ get: mockCookieGet }),
}))

import { POST as applyPost } from '@/app/api/events/[eventId]/apply/route'
import { GET as listApps } from '@/app/api/events/[eventId]/applications/route'
import { PATCH as reviewApp } from '@/app/api/applications/[id]/route'

function req(url: string, options?: RequestInit): Request {
  return new Request(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
}

let orgToken: string
let volToken: string
let unapprovedVolToken: string
let eventId: string
let orgProfileId: string

beforeAll(async () => {
  const ids = (await prisma.user.findMany({ where: { email: { contains: '@apps.test' } }, select: { id: true } })).map(u => u.id)
  await prisma.volunteerApplication.deleteMany({ where: { volunteer: { userId: { in: ids } } } })
  await prisma.event.deleteMany({ where: { organization: { userId: { in: ids } } } })
  await prisma.volunteerProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.organizationProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.user.deleteMany({ where: { id: { in: ids } } })

  const { hashPassword } = await import('@/lib/auth')
  const hashed = await hashPassword('password')

  const orgUser = await prisma.user.create({
    data: { name: 'App Org', email: 'org@apps.test', password: hashed, role: 'ORGANIZATION', status: 'APPROVED' },
  })
  orgToken = jwt.sign({ userId: orgUser.id, role: 'ORGANIZATION' }, TEST_SECRET)
  const orgProfile = await prisma.organizationProfile.create({
    data: { userId: orgUser.id, organizationName: 'App Org Inc', status: 'APPROVED' },
  })
  orgProfileId = orgProfile.id

  const volUser = await prisma.user.create({
    data: { name: 'App Vol', email: 'vol@apps.test', password: hashed, role: 'VOLUNTEER', status: 'APPROVED' },
  })
  volToken = jwt.sign({ userId: volUser.id, role: 'VOLUNTEER' }, TEST_SECRET)
  await prisma.volunteerProfile.create({
    data: { userId: volUser.id, skills: ['Teaching'], interests: ['Education'], status: 'APPROVED' },
  })

  const unapprovedUser = await prisma.user.create({
    data: { name: 'Unapproved Vol', email: 'unapproved@apps.test', password: hashed, role: 'VOLUNTEER', status: 'PENDING' },
  })
  unapprovedVolToken = jwt.sign({ userId: unapprovedUser.id, role: 'VOLUNTEER' }, TEST_SECRET)
  await prisma.volunteerProfile.create({
    data: { userId: unapprovedUser.id, skills: [], interests: [], status: 'PENDING' },
  })

  const event = await prisma.event.create({
    data: {
      title: 'App Test Event',
      description: 'For application tests',
      category: 'Education',
      location: 'Test Location',
      startDate: new Date('2027-06-01T09:00:00Z'),
      endDate: new Date('2027-06-01T17:00:00Z'),
      requiredSkills: ['Teaching'],
      volunteerLimit: 5,
      status: 'PUBLISHED',
      organizationId: orgProfileId,
    },
  })
  eventId = event.id
})

afterAll(async () => {
  const ids = (await prisma.user.findMany({ where: { email: { contains: '@apps.test' } }, select: { id: true } })).map(u => u.id)
  await prisma.volunteerApplication.deleteMany({ where: { volunteer: { userId: { in: ids } } } })
  await prisma.event.deleteMany({ where: { organization: { userId: { in: ids } } } })
  await prisma.volunteerProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.organizationProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.user.deleteMany({ where: { id: { in: ids } } })
})

describe('POST /api/events/:id/apply', () => {
  beforeEach(() => mockCookieGet.mockReset())

  it('volunteer applies returning 201', async () => {
    mockCookieGet.mockReturnValue({ value: volToken })
    const res = await applyPost(req(`http://localhost:3000/api/events/${eventId}/apply`, {
      method: 'POST',
      body: JSON.stringify({ message: 'I want to help!' }),
    }), { params: Promise.resolve({ eventId }) } as any)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.application.status).toBe('PENDING')
  })

  it('duplicate application returns 409', async () => {
    mockCookieGet.mockReturnValue({ value: volToken })
    const res = await applyPost(req(`http://localhost:3000/api/events/${eventId}/apply`, {
      method: 'POST',
      body: JSON.stringify({}),
    }), { params: Promise.resolve({ eventId }) } as any)
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toMatch(/already applied/i)
  })

  it('unapproved volunteer returns 403', async () => {
    mockCookieGet.mockReturnValue({ value: unapprovedVolToken })
    const res = await applyPost(req(`http://localhost:3000/api/events/${eventId}/apply`, {
      method: 'POST',
      body: JSON.stringify({}),
    }), { params: Promise.resolve({ eventId }) } as any)
    expect(res.status).toBe(403)
  })

  it('non-volunteer returns 403', async () => {
    mockCookieGet.mockReturnValue({ value: orgToken })
    const res = await applyPost(req(`http://localhost:3000/api/events/${eventId}/apply`, {
      method: 'POST',
      body: JSON.stringify({}),
    }), { params: Promise.resolve({ eventId }) } as any)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/only volunteers/i)
  })

  it('unauthenticated returns 401', async () => {
    mockCookieGet.mockReturnValue(undefined)
    const res = await applyPost(req(`http://localhost:3000/api/events/${eventId}/apply`, {
      method: 'POST',
      body: JSON.stringify({}),
    }), { params: Promise.resolve({ eventId }) } as any)
    expect(res.status).toBe(401)
  })

  it('event full returns 400', async () => {
    const { hashPassword } = await import('@/lib/auth')
    const hashed = await hashPassword('password')

    // Event with limit 1
    const fullEvent = await prisma.event.create({
      data: {
        title: 'Full Event', description: 'Limit 1', category: 'Other', location: 'Here',
        startDate: new Date('2027-09-01T09:00:00Z'), endDate: new Date('2027-09-01T17:00:00Z'),
        requiredSkills: [], volunteerLimit: 1, status: 'PUBLISHED', organizationId: orgProfileId,
      },
    })

    // Volunteer A applies and gets accepted
    const volA = await prisma.user.create({
      data: { name: 'Vol A', email: 'vola@test.dev', password: hashed, role: 'VOLUNTEER', status: 'APPROVED' },
    })
    const volAToken = jwt.sign({ userId: volA.id, role: 'VOLUNTEER' }, TEST_SECRET)
    await prisma.volunteerProfile.create({ data: { userId: volA.id, skills: [], interests: [], status: 'APPROVED' } })

    mockCookieGet.mockReturnValue({ value: volAToken })
    const appRes = await applyPost(req(`http://localhost:3000/api/events/${fullEvent.id}/apply`, {
      method: 'POST', body: JSON.stringify({}),
    }), { params: Promise.resolve({ eventId: fullEvent.id }) } as any)
    const appId = (await appRes.json()).application.id

    mockCookieGet.mockReturnValue({ value: orgToken })
    await reviewApp(req(`http://localhost:3000/api/applications/${appId}`, {
      method: 'PATCH', body: JSON.stringify({ status: 'ACCEPTED' }),
    }), { params: Promise.resolve({ id: appId }) } as any)

    // Volunteer B tries to apply - event is full
    const volB = await prisma.user.create({
      data: { name: 'Vol B', email: 'volb@test.dev', password: hashed, role: 'VOLUNTEER', status: 'APPROVED' },
    })
    const volBToken = jwt.sign({ userId: volB.id, role: 'VOLUNTEER' }, TEST_SECRET)
    await prisma.volunteerProfile.create({ data: { userId: volB.id, skills: [], interests: [], status: 'APPROVED' } })

    mockCookieGet.mockReturnValue({ value: volBToken })
    const fullRes = await applyPost(req(`http://localhost:3000/api/events/${fullEvent.id}/apply`, {
      method: 'POST', body: JSON.stringify({}),
    }), { params: Promise.resolve({ eventId: fullEvent.id }) } as any)
    expect(fullRes.status).toBe(400)
    const body = await fullRes.json()
    expect(body.error).toMatch(/full/i)

    await prisma.volunteerApplication.deleteMany({ where: { eventId: fullEvent.id } })
    await prisma.event.delete({ where: { id: fullEvent.id } })
    await prisma.volunteerProfile.deleteMany({ where: { userId: { in: [volA.id, volB.id] } } })
    await prisma.user.deleteMany({ where: { id: { in: [volA.id, volB.id] } } })
  })
})

describe('GET /api/events/:id/applications', () => {
  beforeEach(() => mockCookieGet.mockReset())

  it('owner org sees applications', async () => {
    mockCookieGet.mockReturnValue({ value: orgToken })
    const res = await listApps(req(`http://localhost:3000/api/events/${eventId}/applications`), {
      params: Promise.resolve({ eventId }),
    } as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.applications.length).toBeGreaterThanOrEqual(1)
  })

  it('non-owner returns 403', async () => {
    const { hashPassword } = await import('@/lib/auth')
    const hashed = await hashPassword('password')
    const otherOrg = await prisma.user.create({
      data: { name: 'Other Org', email: 'other@apps.test', password: hashed, role: 'ORGANIZATION', status: 'APPROVED' },
    })
    const otherOrgToken = jwt.sign({ userId: otherOrg.id, role: 'ORGANIZATION' }, TEST_SECRET)
    await prisma.organizationProfile.create({
      data: { userId: otherOrg.id, organizationName: 'Other Org Inc', status: 'APPROVED' },
    })

    mockCookieGet.mockReturnValue({ value: otherOrgToken })
    const res = await listApps(req(`http://localhost:3000/api/events/${eventId}/applications`), {
      params: Promise.resolve({ eventId }),
    } as any)
    expect(res.status).toBe(403)

    await prisma.organizationProfile.deleteMany({ where: { userId: otherOrg.id } })
    await prisma.user.delete({ where: { id: otherOrg.id } })
  })
})

describe('PATCH /api/applications/:id', () => {
  let appId: string
  let secondAppId: string

  beforeAll(async () => {
    // Create a fresh volunteer + application for these tests
    const { hashPassword } = await import('@/lib/auth')
    const hashed = await hashPassword('password')
    const freshVol = await prisma.user.create({
      data: { name: 'Fresh Vol', email: 'freshvol@apps.test', password: hashed, role: 'VOLUNTEER', status: 'APPROVED' },
    })
    const freshVolToken = jwt.sign({ userId: freshVol.id, role: 'VOLUNTEER' }, TEST_SECRET)
    await prisma.volunteerProfile.create({
      data: { userId: freshVol.id, skills: [], interests: [], status: 'APPROVED' },
    })

    // Apply once
    mockCookieGet.mockReturnValue({ value: freshVolToken })
    const res1 = await applyPost(req(`http://localhost:3000/api/events/${eventId}/apply`, {
      method: 'POST', body: JSON.stringify({}),
    }), { params: Promise.resolve({ eventId }) } as any)
    appId = (await res1.json()).application.id

    // Apply again (for reject test)
    const freshVol2 = await prisma.user.create({
      data: { name: 'Fresh Vol 2', email: 'freshvol2@apps.test', password: hashed, role: 'VOLUNTEER', status: 'APPROVED' },
    })
    const freshVolToken2 = jwt.sign({ userId: freshVol2.id, role: 'VOLUNTEER' }, TEST_SECRET)
    await prisma.volunteerProfile.create({
      data: { userId: freshVol2.id, skills: [], interests: [], status: 'APPROVED' },
    })
    mockCookieGet.mockReturnValue({ value: freshVolToken2 })
    const res2 = await applyPost(req(`http://localhost:3000/api/events/${eventId}/apply`, {
      method: 'POST', body: JSON.stringify({}),
    }), { params: Promise.resolve({ eventId }) } as any)
    secondAppId = (await res2.json()).application.id
  })

  beforeEach(() => mockCookieGet.mockReset())

  it('org accepts application', async () => {
    mockCookieGet.mockReturnValue({ value: orgToken })
    const res = await reviewApp(req(`http://localhost:3000/api/applications/${appId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ACCEPTED' }),
    }), { params: Promise.resolve({ id: appId }) } as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.application.status).toBe('ACCEPTED')
  })

  it('org rejects application', async () => {
    mockCookieGet.mockReturnValue({ value: orgToken })
    const res = await reviewApp(req(`http://localhost:3000/api/applications/${secondAppId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'REJECTED' }),
    }), { params: Promise.resolve({ id: secondAppId }) } as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.application.status).toBe('REJECTED')
  })

  it('non-owner returns 403', async () => {
    mockCookieGet.mockReturnValue({ value: volToken })
    const res = await reviewApp(req(`http://localhost:3000/api/applications/${appId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ACCEPTED' }),
    }), { params: Promise.resolve({ id: appId }) } as any)
    expect(res.status).toBe(403)
  })

  it('over capacity returns 400', async () => {
    const smallEvent = await prisma.event.create({
      data: {
        title: 'Small Event', description: 'Limit 1', category: 'Other', location: 'Here',
        startDate: new Date('2027-08-01T09:00:00Z'), endDate: new Date('2027-08-01T17:00:00Z'),
        requiredSkills: [], volunteerLimit: 1, status: 'PUBLISHED', organizationId: orgProfileId,
      },
    })

    const { hashPassword } = await import('@/lib/auth')
    const hashed = await hashPassword('password')

    // Create two volunteers and let them both apply before filling the slot
    const vol1 = await prisma.user.create({
      data: { name: 'Over Vol 1', email: 'over1@apps.test', password: hashed, role: 'VOLUNTEER', status: 'APPROVED' },
    })
    const vol1Token = jwt.sign({ userId: vol1.id, role: 'VOLUNTEER' }, TEST_SECRET)
    await prisma.volunteerProfile.create({ data: { userId: vol1.id, skills: [], interests: [], status: 'APPROVED' } })

    const vol2 = await prisma.user.create({
      data: { name: 'Over Vol 2', email: 'over2@apps.test', password: hashed, role: 'VOLUNTEER', status: 'APPROVED' },
    })
    const vol2Token = jwt.sign({ userId: vol2.id, role: 'VOLUNTEER' }, TEST_SECRET)
    await prisma.volunteerProfile.create({ data: { userId: vol2.id, skills: [], interests: [], status: 'APPROVED' } })

    // Both apply while event still has space
    mockCookieGet.mockReturnValue({ value: vol1Token })
    const app1Res = await applyPost(req(`http://localhost:3000/api/events/${smallEvent.id}/apply`, {
      method: 'POST', body: JSON.stringify({}),
    }), { params: Promise.resolve({ eventId: smallEvent.id }) } as any)
    const vol1AppId = (await app1Res.json()).application.id

    mockCookieGet.mockReturnValue({ value: vol2Token })
    const app2Res = await applyPost(req(`http://localhost:3000/api/events/${smallEvent.id}/apply`, {
      method: 'POST', body: JSON.stringify({}),
    }), { params: Promise.resolve({ eventId: smallEvent.id }) } as any)
    expect(app2Res.status).toBe(201)
    const vol2AppId = (await app2Res.json()).application.id

    // Accept vol1 - fills the slot
    mockCookieGet.mockReturnValue({ value: orgToken })
    await reviewApp(req(`http://localhost:3000/api/applications/${vol1AppId}`, {
      method: 'PATCH', body: JSON.stringify({ status: 'ACCEPTED' }),
    }), { params: Promise.resolve({ id: vol1AppId }) } as any)

    // Try to accept vol2 - should be blocked
    mockCookieGet.mockReturnValue({ value: orgToken })
    const overfillRes = await reviewApp(req(`http://localhost:3000/api/applications/${vol2AppId}`, {
      method: 'PATCH', body: JSON.stringify({ status: 'ACCEPTED' }),
    }), { params: Promise.resolve({ id: vol2AppId }) } as any)
    expect(overfillRes.status).toBe(400)
    const body = await overfillRes.json()
    expect(body.error).toMatch(/already full/i)

    await prisma.volunteerApplication.deleteMany({ where: { eventId: smallEvent.id } })
    await prisma.event.delete({ where: { id: smallEvent.id } })
    await prisma.volunteerProfile.deleteMany({ where: { userId: { in: [vol1.id, vol2.id] } } })
    await prisma.user.deleteMany({ where: { id: { in: [vol1.id, vol2.id] } } })
  })
})
