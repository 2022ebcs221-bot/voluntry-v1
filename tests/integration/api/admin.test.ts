import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { prisma } from '../../setup'
import jwt from 'jsonwebtoken'

const TEST_SECRET = process.env.JWT_SECRET || 'default-secret-key'

const mockCookieGet = vi.hoisted(() => vi.fn())
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ get: mockCookieGet }),
}))

import { GET as statsGet } from '@/app/api/admin/stats/route'
import { GET as approvalsGet } from '@/app/api/admin/approvals/route'
import { GET as approvedGet } from '@/app/api/admin/approved/route'
import { PATCH as userStatusPatch } from '@/app/api/admin/users/[userId]/status/route'
import { GET as userProfileGet } from '@/app/api/admin/users/[userId]/profile/route'

function req(url: string, options?: RequestInit): Request {
  return new Request(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
}

let adminToken: string
let volToken: string
let pendingUserId: string
let approvedUserId: string

beforeAll(async () => {
  const ids = (await prisma.user.findMany({ where: { email: { contains: '@admin.test' } }, select: { id: true } })).map(u => u.id)
  await prisma.volunteerApplication.deleteMany({ where: { volunteer: { userId: { in: ids } } } })
  await prisma.event.deleteMany({ where: { organization: { userId: { in: ids } } } })
  await prisma.volunteerProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.organizationProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.user.deleteMany({ where: { id: { in: ids } } })

  const { hashPassword } = await import('@/lib/auth')
  const hashed = await hashPassword('password')

  const admin = await prisma.user.create({
    data: { name: 'Admin User', email: 'admin@admin.test', password: hashed, role: 'ADMIN', status: 'APPROVED' },
  })
  adminToken = jwt.sign({ userId: admin.id, role: 'ADMIN' }, TEST_SECRET)

  const vol = await prisma.user.create({
    data: { name: 'Regular User', email: 'regular@admin.test', password: hashed, role: 'VOLUNTEER', status: 'APPROVED' },
  })
  volToken = jwt.sign({ userId: vol.id, role: 'VOLUNTEER' }, TEST_SECRET)
  await prisma.volunteerProfile.create({
    data: { userId: vol.id, skills: [], interests: [], status: 'APPROVED' },
  })
  approvedUserId = vol.id

  const pendingUser = await prisma.user.create({
    data: { name: 'Pending User', email: 'pending@admin.test', password: hashed, role: 'VOLUNTEER', status: 'PENDING' },
  })
  pendingUserId = pendingUser.id
  await prisma.volunteerProfile.create({
    data: { userId: pendingUser.id, skills: [], interests: [], status: 'PENDING' },
  })
})

afterAll(async () => {
  const ids = (await prisma.user.findMany({ where: { email: { contains: '@admin.test' } }, select: { id: true } })).map(u => u.id)
  await prisma.volunteerApplication.deleteMany({ where: { volunteer: { userId: { in: ids } } } })
  await prisma.event.deleteMany({ where: { organization: { userId: { in: ids } } } })
  await prisma.volunteerProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.organizationProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.user.deleteMany({ where: { id: { in: ids } } })
})

describe('GET /api/admin/stats', () => {
  beforeEach(() => mockCookieGet.mockReset())

  it('returns all counts for admin', async () => {
    mockCookieGet.mockReturnValue({ value: adminToken })
    const res = await statsGet(req('http://localhost:3000/api/admin/stats'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('totalVolunteers')
    expect(body).toHaveProperty('totalOrganizations')
    expect(body).toHaveProperty('activeEvents')
    expect(body).toHaveProperty('pendingOrgApprovals')
    expect(body).toHaveProperty('pendingVolunteerVerifications')
    expect(body).toHaveProperty('rejectedVolunteers')
    expect(body).toHaveProperty('rejectedOrganizations')
  })

  it('non-admin returns 403', async () => {
    mockCookieGet.mockReturnValue({ value: volToken })
    const res = await statsGet(req('http://localhost:3000/api/admin/stats'))
    expect(res.status).toBe(403)
  })
})

describe('GET /api/admin/approvals', () => {
  beforeEach(() => mockCookieGet.mockReset())

  it('returns pending lists for admin', async () => {
    mockCookieGet.mockReturnValue({ value: adminToken })
    const res = await approvalsGet(req('http://localhost:3000/api/admin/approvals'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('pendingOrganizations')
    expect(body).toHaveProperty('pendingVolunteers')
    expect(body.pendingVolunteers.length).toBeGreaterThanOrEqual(1)
  })
})

describe('GET /api/admin/approved', () => {
  beforeEach(() => mockCookieGet.mockReset())

  it('returns approved lists for admin', async () => {
    mockCookieGet.mockReturnValue({ value: adminToken })
    const res = await approvedGet(req('http://localhost:3000/api/admin/approved'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('approvedVolunteers')
    expect(body).toHaveProperty('approvedOrganizations')
    expect(body.approvedVolunteers.length).toBeGreaterThanOrEqual(1)
  })
})

describe('PATCH /api/admin/users/:id/status', () => {
  beforeEach(() => mockCookieGet.mockReset())

  it('approves a pending user', async () => {
    mockCookieGet.mockReturnValue({ value: adminToken })
    const res = await userStatusPatch(req(`http://localhost:3000/api/admin/users/${pendingUserId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'APPROVED' }),
    }), { params: Promise.resolve({ userId: pendingUserId }) } as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toMatch(/approved/i)

    const user = await prisma.user.findUnique({ where: { id: pendingUserId } })
    expect(user?.status).toBe('APPROVED')
  })

  it('rejects a user', async () => {
    mockCookieGet.mockReturnValue({ value: adminToken })
    const res = await userStatusPatch(req(`http://localhost:3000/api/admin/users/${pendingUserId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'REJECTED' }),
    }), { params: Promise.resolve({ userId: pendingUserId }) } as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toMatch(/rejected/i)
  })

  it('non-admin returns 403', async () => {
    mockCookieGet.mockReturnValue({ value: volToken })
    const res = await userStatusPatch(req(`http://localhost:3000/api/admin/users/${pendingUserId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'APPROVED' }),
    }), { params: Promise.resolve({ userId: pendingUserId }) } as any)
    expect(res.status).toBe(403)
  })
})

describe('GET /api/admin/users/:id/profile', () => {
  beforeEach(() => mockCookieGet.mockReset())

  it('returns full profile for admin', async () => {
    mockCookieGet.mockReturnValue({ value: adminToken })
    const res = await userProfileGet(req(`http://localhost:3000/api/admin/users/${approvedUserId}/profile`), {
      params: Promise.resolve({ userId: approvedUserId }),
    } as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.user).toBeDefined()
    expect(body.user.id).toBe(approvedUserId)
    expect(body.user.volunteerProfile).not.toBeNull()
  })
})
