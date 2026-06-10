import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { prisma } from '../../setup'
import jwt from 'jsonwebtoken'

const TEST_SECRET = process.env.JWT_SECRET || 'default-secret-key'

const mockCookieGet = vi.hoisted(() => vi.fn())
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ get: mockCookieGet }),
}))

import { POST } from '@/app/api/upload/route'
import { rm } from 'fs/promises'
import path from 'path'

let volToken: string

beforeAll(async () => {
  const ids = (await prisma.user.findMany({ where: { email: { contains: '@upload.test' } }, select: { id: true } })).map(u => u.id)
  await prisma.volunteerApplication.deleteMany({ where: { volunteer: { userId: { in: ids } } } })
  await prisma.event.deleteMany({ where: { organization: { userId: { in: ids } } } })
  await prisma.volunteerProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.organizationProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.user.deleteMany({ where: { id: { in: ids } } })

  const { hashPassword } = await import('@/lib/auth')
  const hashed = await hashPassword('password')
  const vol = await prisma.user.create({
    data: { name: 'Upload Vol', email: 'vol@upload.test', password: hashed, role: 'VOLUNTEER', status: 'APPROVED' },
  })
  volToken = jwt.sign({ userId: vol.id, role: 'VOLUNTEER' }, TEST_SECRET)
  await prisma.volunteerProfile.create({ data: { userId: vol.id, skills: [], interests: [], status: 'APPROVED' } })
})

afterAll(async () => {
  const ids = (await prisma.user.findMany({ where: { email: { contains: '@upload.test' } }, select: { id: true } })).map(u => u.id)
  await prisma.volunteerApplication.deleteMany({ where: { volunteer: { userId: { in: ids } } } })
  await prisma.event.deleteMany({ where: { organization: { userId: { in: ids } } } })
  await prisma.volunteerProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.organizationProfile.deleteMany({ where: { userId: { in: ids } } })
  await prisma.user.deleteMany({ where: { id: { in: ids } } })
})

describe('POST /api/upload', () => {
  beforeEach(() => mockCookieGet.mockReset())

  it('uploads an image file', async () => {
    mockCookieGet.mockReturnValue({ value: volToken })
    const blob = new Blob(['fake-image-content'], { type: 'image/jpeg' })
    const file = new File([blob], 'test.jpg', { type: 'image/jpeg' })
    const formData = new FormData()
    formData.append('file', file)

    const res = await POST(new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toMatch(/\/uploads\/avatars\//)
    expect(body.message).toBe('File uploaded successfully')
  })

  it('returns 400 when no file provided', async () => {
    mockCookieGet.mockReturnValue({ value: volToken })
    const formData = new FormData()
    const res = await POST(new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('No file provided')
  })

  it('returns 400 for wrong file type', async () => {
    mockCookieGet.mockReturnValue({ value: volToken })
    const blob = new Blob(['fake-pdf-content'], { type: 'application/pdf' })
    const file = new File([blob], 'document.pdf', { type: 'application/pdf' })
    const formData = new FormData()
    formData.append('file', file)
    const res = await POST(new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/image/i)
  })

  it('returns 401 when unauthenticated', async () => {
    mockCookieGet.mockReturnValue(undefined)
    const blob = new Blob(['test'], { type: 'image/jpeg' })
    const file = new File([blob], 'test.jpg', { type: 'image/jpeg' })
    const formData = new FormData()
    formData.append('file', file)
    const res = await POST(new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    }))
    expect(res.status).toBe(401)
  })
})
