import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { prisma } from '../../setup'
import jwt from 'jsonwebtoken'

const TEST_SECRET = process.env.JWT_SECRET || 'default-secret-key'

const mockCookieGet = vi.hoisted(() => vi.fn())
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ get: mockCookieGet }),
}))

import { GET as getVolProfile, POST as updateVolProfile } from '@/app/api/profile/volunteer/route'
import { GET as getOrgProfile, POST as updateOrgProfile } from '@/app/api/profile/organization/route'

function req(url: string, options?: RequestInit): Request {
  return new Request(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
}

let volToken: string
let orgToken: string

beforeAll(async () => {
  const ids = (await prisma.user.findMany({ where: { email: { contains: '@prof.test' } }, select: { id: true } })).map(u => u.id)
  await prisma.volunteerProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.organizationProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.user.deleteMany({ where: { id: { in: ids } } })

  const { hashPassword } = await import('@/lib/auth')
  const hashed = await hashPassword('password')

  const vol = await prisma.user.create({
    data: { name: 'Prof Vol', email: 'vol@prof.test', password: hashed, role: 'VOLUNTEER', status: 'APPROVED' },
  })
  volToken = jwt.sign({ userId: vol.id, role: 'VOLUNTEER' }, TEST_SECRET)
  await prisma.volunteerProfile.create({
    data: { userId: vol.id, skills: ['Teaching'], interests: ['Education'], status: 'APPROVED' },
  })

  const org = await prisma.user.create({
    data: { name: 'Prof Org', email: 'org@prof.test', password: hashed, role: 'ORGANIZATION', status: 'APPROVED' },
  })
  orgToken = jwt.sign({ userId: org.id, role: 'ORGANIZATION' }, TEST_SECRET)
  await prisma.organizationProfile.create({
    data: { userId: org.id, organizationName: 'Prof Org Inc', status: 'APPROVED' },
  })
})

afterAll(async () => {
  const ids = (await prisma.user.findMany({ where: { email: { contains: '@prof.test' } }, select: { id: true } })).map(u => u.id)
  await prisma.volunteerProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.organizationProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.user.deleteMany({ where: { id: { in: ids } } })
})

describe('GET /api/profile/volunteer', () => {
  beforeEach(() => mockCookieGet.mockReset())

  it('returns volunteer profile when authenticated', async () => {
    mockCookieGet.mockReturnValue({ value: volToken })
    const res = await getVolProfile(req('http://localhost:3000/api/profile/volunteer'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.profile).toBeDefined()
    expect(body.userName).toBe('Prof Vol')
  })

  it('returns 401 when unauthenticated', async () => {
    mockCookieGet.mockReturnValue(undefined)
    const res = await getVolProfile(req('http://localhost:3000/api/profile/volunteer'))
    expect(res.status).toBe(401)
  })
})

describe('POST /api/profile/volunteer', () => {
  beforeEach(() => mockCookieGet.mockReset())

  it('updates profile', async () => {
    mockCookieGet.mockReturnValue({ value: volToken })
    const res = await updateVolProfile(req('http://localhost:3000/api/profile/volunteer', {
      method: 'POST',
      body: JSON.stringify({ bio: 'Updated bio', location: 'Boston' }),
    }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toBe('Profile updated successfully')
  })

  it('partial update only touches specified fields', async () => {
    mockCookieGet.mockReturnValue({ value: volToken })
    const res = await updateVolProfile(req('http://localhost:3000/api/profile/volunteer', {
      method: 'POST',
      body: JSON.stringify({ phone: '555-0100' }),
    }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.profile.phone).toBe('555-0100')
    expect(body.profile.location).toBe('Boston')
  })
})

describe('GET /api/profile/organization', () => {
  beforeEach(() => mockCookieGet.mockReset())

  it('returns org profile when authenticated', async () => {
    mockCookieGet.mockReturnValue({ value: orgToken })
    const res = await getOrgProfile(req('http://localhost:3000/api/profile/organization'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.profile).toBeDefined()
    expect(body.profile.organizationName).toBe('Prof Org Inc')
  })

  it('returns 401 when unauthenticated', async () => {
    mockCookieGet.mockReturnValue(undefined)
    const res = await getOrgProfile(req('http://localhost:3000/api/profile/organization'))
    expect(res.status).toBe(401)
  })
})

describe('POST /api/profile/organization', () => {
  beforeEach(() => mockCookieGet.mockReset())

  it('updates org profile', async () => {
    mockCookieGet.mockReturnValue({ value: orgToken })
    const res = await updateOrgProfile(req('http://localhost:3000/api/profile/organization', {
      method: 'POST',
      body: JSON.stringify({ organizationName: 'Updated Org', description: 'New description' }),
    }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toBe('Profile updated successfully')
  })

  it('rejects missing organization name', async () => {
    mockCookieGet.mockReturnValue({ value: orgToken })
    const res = await updateOrgProfile(req('http://localhost:3000/api/profile/organization', {
      method: 'POST',
      body: JSON.stringify({ description: 'No name provided' }),
    }))
    expect(res.status).toBe(400)
  })
})
