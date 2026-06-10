import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { prisma } from '../../setup'
import jwt from 'jsonwebtoken'

const TEST_SECRET = process.env.JWT_SECRET || 'default-secret-key'

// Mock next/headers for the /me route which uses getAuthToken()
const mockCookieGet = vi.hoisted(() => vi.fn())
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ get: mockCookieGet }),
}))

import { POST as registerPost } from '@/app/api/auth/register/route'
import { POST as loginPost } from '@/app/api/auth/login/route'
import { POST as logoutPost } from '@/app/api/auth/logout/route'
import { GET as meGet } from '@/app/api/auth/me/route'

function req(url: string, options?: RequestInit): Request {
  return new Request(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
}

beforeAll(async () => {
  const ids = (await prisma.user.findMany({ where: { email: { contains: '@test.dev' } }, select: { id: true } })).map(u => u.id)
  await prisma.volunteerApplication.deleteMany({ where: { volunteer: { userId: { in: ids } } } })
  await prisma.event.deleteMany({ where: { organization: { userId: { in: ids } } } })
  await prisma.volunteerProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.organizationProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.user.deleteMany({ where: { id: { in: ids } } })

  // Create a user for login tests
  const { hashPassword } = await import('@/lib/auth')
  const hashed = await hashPassword('correct-password')
  await prisma.user.create({
    data: {
      name: 'Login Test User',
      email: 'login-valid@test.dev',
      password: hashed,
      role: 'VOLUNTEER',
      status: 'APPROVED',
    },
  })
})

afterAll(async () => {
  const ids = (await prisma.user.findMany({ where: { email: { contains: '@test.dev' } }, select: { id: true } })).map(u => u.id)
  await prisma.volunteerApplication.deleteMany({ where: { volunteer: { userId: { in: ids } } } })
  await prisma.event.deleteMany({ where: { organization: { userId: { in: ids } } } })
  await prisma.volunteerProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.organizationProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.user.deleteMany({ where: { id: { in: ids } } })
})

describe('POST /api/auth/register', () => {
  it('creates a volunteer user and returns 201', async () => {
    const res = await registerPost(req('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Volunteer',
        email: 'reg-vol@test.dev',
        password: 'secret123',
        role: 'VOLUNTEER',
      }),
    }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.message).toBe('User created successfully')
    expect(body.userId).toBeDefined()

    // Verify volunteer profile was auto-created
    const user = await prisma.user.findUnique({ where: { email: 'reg-vol@test.dev' } })
    expect(user).not.toBeNull()
    expect(user!.role).toBe('VOLUNTEER')

    const profile = await prisma.volunteerProfile.findUnique({ where: { userId: user!.id } })
    expect(profile).not.toBeNull()
  })

  it('creates an organization user and returns 201', async () => {
    const res = await registerPost(req('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Org',
        email: 'reg-org@test.dev',
        password: 'secret123',
        role: 'ORGANIZATION',
      }),
    }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.message).toBe('User created successfully')

    // Verify org profile was auto-created
    const user = await prisma.user.findUnique({ where: { email: 'reg-org@test.dev' } })
    expect(user).not.toBeNull()
    expect(user!.role).toBe('ORGANIZATION')

    const profile = await prisma.organizationProfile.findUnique({ where: { userId: user!.id } })
    expect(profile).not.toBeNull()
  })

  it('rejects duplicate email with 409', async () => {
    const res1 = await registerPost(req('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Dupe User',
        email: 'reg-dupe@test.dev',
        password: 'secret123',
        role: 'VOLUNTEER',
      }),
    }))
    expect(res1.status).toBe(201)

    const res2 = await registerPost(req('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Dupe User 2',
        email: 'reg-dupe@test.dev',
        password: 'secret123',
        role: 'VOLUNTEER',
      }),
    }))
    expect(res2.status).toBe(409)
    const body = await res2.json()
    expect(body.error).toBe('User already exists')
  })

  it('rejects missing required fields with 400', async () => {
    const res = await registerPost(req('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'missing@test.dev' }),
    }))
    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/login', () => {
  it('returns 200 with auth cookie for valid credentials', async () => {
    const res = await loginPost(req('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'login-valid@test.dev',
        password: 'correct-password',
      }),
    }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toBe('Login successful')
    expect(body.user).toBeDefined()
    expect(body.user.email).toBe('login-valid@test.dev')

    // Check that auth_token cookie was set
    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toContain('auth_token=')
  })

  it('returns 401 for wrong password', async () => {
    const res = await loginPost(req('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'login-valid@test.dev',
        password: 'wrong-password',
      }),
    }))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Invalid credentials')
  })

  it('returns 401 for non-existent email', async () => {
    const res = await loginPost(req('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'nonexistent@test.dev',
        password: 'some-password',
      }),
    }))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Invalid credentials')
  })
})

describe('POST /api/auth/logout', () => {
  it('clears the auth_token cookie', async () => {
    const res = await logoutPost()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toBe('Logged out successfully')

    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toContain('auth_token=')
    expect(setCookie).toContain('Max-Age=0')
  })
})

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    mockCookieGet.mockReset()
  })

  it('returns role for authenticated user', async () => {
    const token = jwt.sign({ userId: 'test-user-id', role: 'VOLUNTEER' }, TEST_SECRET)
    mockCookieGet.mockReturnValue({ value: token })

    const res = await meGet()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.role).toBe('VOLUNTEER')
  })

  it('returns role: null when no auth cookie', async () => {
    mockCookieGet.mockReturnValue(undefined)

    const res = await meGet()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.role).toBeNull()
  })

  it('returns role: null for invalid cookie', async () => {
    mockCookieGet.mockReturnValue({ value: 'garbage-token' })

    const res = await meGet()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.role).toBeNull()
  })
})
