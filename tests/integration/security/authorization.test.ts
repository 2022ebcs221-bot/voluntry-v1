import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { prisma } from '../../setup'
import jwt from 'jsonwebtoken'

const TEST_SECRET = process.env.JWT_SECRET || 'default-secret-key'

const mockCookieGet = vi.hoisted(() => vi.fn())
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ get: mockCookieGet }),
}))

import { GET as statsGet } from '@/app/api/admin/stats/route'
import { GET as eventsGet, POST as eventsPost } from '@/app/api/events/route'
import { GET as volDashboard } from '@/app/api/dashboard/volunteer/route'

function req(url: string, options?: RequestInit): Request {
  return new Request(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
}

let adminToken: string
let adminUserId: string
let volToken: string

beforeAll(async () => {
  const ids = (await prisma.user.findMany({ where: { email: { contains: '@security.test' } }, select: { id: true } })).map(u => u.id)
  await prisma.volunteerApplication.deleteMany({ where: { volunteer: { userId: { in: ids } } } })
  await prisma.event.deleteMany({ where: { organization: { userId: { in: ids } } } })
  await prisma.volunteerProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.organizationProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.user.deleteMany({ where: { id: { in: ids } } })

  const { hashPassword } = await import('@/lib/auth')
  const hashed = await hashPassword('password')

  const admin = await prisma.user.create({
    data: { name: 'Sec Admin', email: 'admin@security.test', password: hashed, role: 'ADMIN', status: 'APPROVED' },
  })
  adminUserId = admin.id
  adminToken = jwt.sign({ userId: admin.id, role: 'ADMIN' }, TEST_SECRET)

  const vol = await prisma.user.create({
    data: { name: 'Sec Vol', email: 'vol@security.test', password: hashed, role: 'VOLUNTEER', status: 'APPROVED' },
  })
  volToken = jwt.sign({ userId: vol.id, role: 'VOLUNTEER' }, TEST_SECRET)
  await prisma.volunteerProfile.create({
    data: { userId: vol.id, skills: [], interests: [], status: 'APPROVED' },
  })
})

afterAll(async () => {
  const ids = (await prisma.user.findMany({ where: { email: { contains: '@security.test' } }, select: { id: true } })).map(u => u.id)
  await prisma.volunteerApplication.deleteMany({ where: { volunteer: { userId: { in: ids } } } })
  await prisma.event.deleteMany({ where: { organization: { userId: { in: ids } } } })
  await prisma.volunteerProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.organizationProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.user.deleteMany({ where: { id: { in: ids } } })
})

describe('Expired JWT on protected route', () => {
  beforeEach(() => mockCookieGet.mockReset())

  it('returns 401/403 for expired token', async () => {
    const expiredToken = jwt.sign({ userId: adminUserId, role: 'ADMIN' }, TEST_SECRET, { expiresIn: '0s' })
    mockCookieGet.mockReturnValue({ value: expiredToken })
    const res = await statsGet(req('http://localhost:3000/api/admin/stats'))
    expect([401, 403]).toContain(res.status)
  })
})

describe('Wrong role on endpoint', () => {
  beforeEach(() => mockCookieGet.mockReset())

  it('returns 403 for volunteer accessing admin endpoint', async () => {
    mockCookieGet.mockReturnValue({ value: volToken })
    const res = await statsGet(req('http://localhost:3000/api/admin/stats'))
    expect(res.status).toBe(403)
  })

  it('returns 403 for non-org creating event', async () => {
    mockCookieGet.mockReturnValue({ value: volToken })
    const res = await eventsPost(req('http://localhost:3000/api/events', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test', description: 'Test', category: 'Test', location: 'Test',
        startDate: '2027-01-01T00:00:00Z', endDate: '2027-01-01T01:00:00Z', volunteerLimit: 5,
      }),
    }))
    expect(res.status).toBe(403)
  })

  it('returns 403 for non-admin accessing dashboard', async () => {
    mockCookieGet.mockReturnValue({ value: adminToken })
    const res = await volDashboard(req('http://localhost:3000/api/dashboard/volunteer'))
    expect(res.status).toBe(403)
  })
})

describe('No cookie on protected route', () => {
  beforeEach(() => mockCookieGet.mockReset())

  it('returns 401 when no auth cookie', async () => {
    mockCookieGet.mockReturnValue(undefined)
    const res = await statsGet(req('http://localhost:3000/api/admin/stats'))
    expect(res.status).toBe(401)
  })
})

describe('Tampered cookie', () => {
  beforeEach(() => mockCookieGet.mockReset())

  it('returns 401/403 for tampered JWT', async () => {
    const token = jwt.sign({ userId: adminUserId, role: 'ADMIN' }, TEST_SECRET)
    const parts = token.split('.')
    const tampered = `${parts[0]}.${parts[1]}.invalidsignature`
    mockCookieGet.mockReturnValue({ value: tampered })
    const res = await statsGet(req('http://localhost:3000/api/admin/stats'))
    expect([401, 403]).toContain(res.status)
  })
})

describe('SQL injection in search', () => {
  beforeEach(() => mockCookieGet.mockReset())

  it('handles SQL injection in category parameter without crashing', async () => {
    mockCookieGet.mockReturnValue(undefined)
    const res = await eventsGet(req("http://localhost:3000/api/events?category='; DROP TABLE users; --"))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.events)).toBe(true)
  })

  it('handles SQL injection in skills parameter without crashing', async () => {
    mockCookieGet.mockReturnValue(undefined)
    const res = await eventsGet(req("http://localhost:3000/api/events?skills=' OR '1'='1"))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.events)).toBe(true)
  })
})

describe('XSS in event title/description', () => {
  let xssEventId: string
  let orgToken: string
  let orgProfileId: string

  beforeAll(async () => {
    const { hashPassword } = await import('@/lib/auth')
    const hashed = await hashPassword('password')
    const org = await prisma.user.create({
      data: { name: 'XSS Org', email: 'xss@security.test', password: hashed, role: 'ORGANIZATION', status: 'APPROVED' },
    })
    orgToken = jwt.sign({ userId: org.id, role: 'ORGANIZATION' }, TEST_SECRET)
    const profile = await prisma.organizationProfile.create({
      data: { userId: org.id, organizationName: 'XSS Org Inc', status: 'APPROVED' },
    })
    orgProfileId = profile.id

    const event = await prisma.event.create({
      data: {
        title: '<script>alert("xss")</script>',
        description: '<img src=x onerror=alert(1)>',
        category: 'Test',
        location: 'Test',
        startDate: new Date('2027-01-01T00:00:00Z'),
        endDate: new Date('2027-01-01T01:00:00Z'),
        requiredSkills: [],
        volunteerLimit: 5,
        status: 'PUBLISHED',
        organizationId: orgProfileId,
      },
    })
    xssEventId = event.id
  })

  beforeEach(() => mockCookieGet.mockReset())

  it('returns XSS payload in title and description as-is (no sanitization at API level)', async () => {
    mockCookieGet.mockReturnValue(undefined)
    const res = await eventsGet(req('http://localhost:3000/api/events'))
    expect(res.status).toBe(200)
    const body = await res.json()

    const xssEvent = body.events.find((e: any) => e.id === xssEventId)
    expect(xssEvent).toBeDefined()
    expect(xssEvent.title).toContain('<script>')
    expect(xssEvent.description).toContain('<img')
  })
})
