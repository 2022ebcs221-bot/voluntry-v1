import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { isAuthorized, getDashboardPath, decodeToken, isUserApproved } from '@/lib/permissions'
import { prisma } from '../setup'
import jwt from 'jsonwebtoken'

const TEST_SECRET = process.env.JWT_SECRET || 'default-secret-key'

describe('isAuthorized', () => {
  it('returns true when role is in allowed list', () => {
    expect(isAuthorized('ADMIN', ['ADMIN'])).toBe(true)
    expect(isAuthorized('VOLUNTEER', ['VOLUNTEER', 'ADMIN'])).toBe(true)
    expect(isAuthorized('ORGANIZATION', ['VOLUNTEER', 'ORGANIZATION'])).toBe(true)
  })

  it('returns false when role is not in allowed list', () => {
    expect(isAuthorized('VOLUNTEER', ['ADMIN'])).toBe(false)
    expect(isAuthorized('ORGANIZATION', ['VOLUNTEER'])).toBe(false)
    expect(isAuthorized('ADMIN', ['VOLUNTEER', 'ORGANIZATION'])).toBe(false)
  })

  it('returns false when role is undefined', () => {
    expect(isAuthorized(undefined, ['ADMIN'])).toBe(false)
  })

  it('returns false when allowed list is empty', () => {
    expect(isAuthorized('ADMIN', [])).toBe(false)
  })
})

describe('getDashboardPath', () => {
  it('returns /dashboard/admin for ADMIN', () => {
    expect(getDashboardPath('ADMIN')).toBe('/dashboard/admin')
  })

  it('returns /dashboard/volunteer for VOLUNTEER', () => {
    expect(getDashboardPath('VOLUNTEER')).toBe('/dashboard/volunteer')
  })

  it('returns /dashboard/organization for ORGANIZATION', () => {
    expect(getDashboardPath('ORGANIZATION')).toBe('/dashboard/organization')
  })

  it('returns / for unknown roles', () => {
    expect(getDashboardPath('UNKNOWN')).toBe('/')
    expect(getDashboardPath('')).toBe('/')
  })
})

describe('decodeToken', () => {
  it('returns payload for a valid JWT', () => {
    const token = jwt.sign({ userId: 'user-1', role: 'VOLUNTEER' }, TEST_SECRET)
    const decoded = decodeToken(token) as { userId: string; role: string }
    expect(decoded).not.toBeNull()
    expect(decoded.userId).toBe('user-1')
    expect(decoded.role).toBe('VOLUNTEER')
  })

  it('returns null for garbage input', () => {
    expect(decodeToken('not-a-token')).toBeNull()
  })

  it('returns null for a tampered token', () => {
    const token = jwt.sign({ userId: 'user-1', role: 'VOLUNTEER' }, TEST_SECRET)
    const parts = token.split('.')
    const tampered = `${parts[0]}.${parts[1]}.bad`
    expect(decodeToken(tampered)).toBeNull()
  })
})

describe('isUserApproved', () => {
  let approvedUserId: string
  let pendingUserId: string

  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: ['approved@test.com', 'pending@test.com'] } } })

    const approved = await prisma.user.create({
      data: {
        name: 'Approved User',
        email: 'approved@test.com',
        password: 'hash',
        role: 'VOLUNTEER',
        status: 'APPROVED',
      },
    })
    approvedUserId = approved.id

    const pending = await prisma.user.create({
      data: {
        name: 'Pending User',
        email: 'pending@test.com',
        password: 'hash',
        role: 'VOLUNTEER',
        status: 'PENDING',
      },
    })
    pendingUserId = pending.id
  })

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: ['approved@test.com', 'pending@test.com'] } } })
  })

  it('returns true for an approved user', async () => {
    const result = await isUserApproved(approvedUserId)
    expect(result).toBe(true)
  })

  it('returns false for a pending user', async () => {
    const result = await isUserApproved(pendingUserId)
    expect(result).toBe(false)
  })

  it('returns false for a non-existent user', async () => {
    const result = await isUserApproved('non-existent-id')
    expect(result).toBe(false)
  })
})
