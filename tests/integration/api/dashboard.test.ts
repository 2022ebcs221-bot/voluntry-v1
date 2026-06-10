import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { prisma } from '../../setup'
import jwt from 'jsonwebtoken'

const TEST_SECRET = process.env.JWT_SECRET || 'default-secret-key'

const mockCookieGet = vi.hoisted(() => vi.fn())
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ get: mockCookieGet }),
}))

import { GET as volDashboard } from '@/app/api/dashboard/volunteer/route'
import { GET as orgDashboard } from '@/app/api/dashboard/organization/route'

function req(url: string): Request {
  return new Request(url)
}

let volToken: string
let unapprovedVolToken: string
let orgToken: string

beforeAll(async () => {
  const ids = (await prisma.user.findMany({ where: { email: { contains: '@dash.test' } }, select: { id: true } })).map(u => u.id)
  await prisma.volunteerApplication.deleteMany({ where: { volunteer: { userId: { in: ids } } } })
  await prisma.event.deleteMany({ where: { organization: { userId: { in: ids } } } })
  await prisma.volunteerProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.organizationProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.user.deleteMany({ where: { id: { in: ids } } })

  const { hashPassword } = await import('@/lib/auth')
  const hashed = await hashPassword('password')

  const vol = await prisma.user.create({
    data: { name: 'Dash Vol', email: 'vol@dash.test', password: hashed, role: 'VOLUNTEER', status: 'APPROVED' },
  })
  volToken = jwt.sign({ userId: vol.id, role: 'VOLUNTEER' }, TEST_SECRET)
  await prisma.volunteerProfile.create({
    data: { userId: vol.id, skills: ['Teaching'], interests: ['Education'], availability: 'Weekends', bio: 'Helper', location: 'NYC', phone: '123', status: 'APPROVED' },
  })

  const unapproved = await prisma.user.create({
    data: { name: 'Pending Vol', email: 'pending@dash.test', password: hashed, role: 'VOLUNTEER', status: 'PENDING' },
  })
  unapprovedVolToken = jwt.sign({ userId: unapproved.id, role: 'VOLUNTEER' }, TEST_SECRET)
  await prisma.volunteerProfile.create({
    data: { userId: unapproved.id, skills: [], interests: [], status: 'PENDING' },
  })

  const org = await prisma.user.create({
    data: { name: 'Dash Org', email: 'org@dash.test', password: hashed, role: 'ORGANIZATION', status: 'APPROVED' },
  })
  orgToken = jwt.sign({ userId: org.id, role: 'ORGANIZATION' }, TEST_SECRET)
  await prisma.organizationProfile.create({
    data: { userId: org.id, organizationName: 'Dash Org Inc', status: 'APPROVED' },
  })
})

afterAll(async () => {
  const ids = (await prisma.user.findMany({ where: { email: { contains: '@dash.test' } }, select: { id: true } })).map(u => u.id)
  await prisma.volunteerApplication.deleteMany({ where: { volunteer: { userId: { in: ids } } } })
  await prisma.event.deleteMany({ where: { organization: { userId: { in: ids } } } })
  await prisma.volunteerProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.organizationProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.user.deleteMany({ where: { id: { in: ids } } })
})

describe('GET /api/dashboard/volunteer', () => {
  beforeEach(() => mockCookieGet.mockReset())

  it('returns profile, applications, and recommendations', async () => {
    mockCookieGet.mockReturnValue({ value: volToken })
    const res = await volDashboard(req('http://localhost:3000/api/dashboard/volunteer'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.profile).toBeDefined()
    expect(body.profile.completionPercentage).toBeGreaterThanOrEqual(0)
    expect(body.applications).toBeDefined()
    expect(body.recommendedEvents).toBeDefined()
  })

  it('unapproved user returns 403', async () => {
    mockCookieGet.mockReturnValue({ value: unapprovedVolToken })
    const res = await volDashboard(req('http://localhost:3000/api/dashboard/volunteer'))
    expect(res.status).toBe(403)
  })

  it('non-volunteer returns 403', async () => {
    mockCookieGet.mockReturnValue({ value: orgToken })
    const res = await volDashboard(req('http://localhost:3000/api/dashboard/volunteer'))
    expect(res.status).toBe(403)
  })
})

describe('GET /api/dashboard/organization', () => {
  beforeEach(() => mockCookieGet.mockReset())

  it('returns org data', async () => {
    mockCookieGet.mockReturnValue({ value: orgToken })
    const res = await orgDashboard(req('http://localhost:3000/api/dashboard/organization'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.profile).toBeDefined()
    expect(body.events).toBeDefined()
    expect(body.pendingApplications).toBeDefined()
  })

  it('non-org returns 403', async () => {
    mockCookieGet.mockReturnValue({ value: volToken })
    const res = await orgDashboard(req('http://localhost:3000/api/dashboard/organization'))
    expect(res.status).toBe(403)
  })
})
