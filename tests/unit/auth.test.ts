import { describe, it, expect } from 'vitest'
import { hashPassword, comparePassword, generateToken, verifyToken } from '@/lib/auth'
import jwt from 'jsonwebtoken'

const TEST_SECRET = 'default-secret-key'

describe('hashPassword', () => {
  it('returns a bcrypt hash starting with $2a$ or $2b$', async () => {
    const hash = await hashPassword('mypassword')
    expect(hash).toMatch(/^\$2[ab]\$10\$/)
  })

  it('produces different hashes for the same password', async () => {
    const [a, b] = await Promise.all([hashPassword('test'), hashPassword('test')])
    expect(a).not.toBe(b)
  })
})

describe('comparePassword', () => {
  it('returns true for matching password', async () => {
    const hash = await hashPassword('correct-password')
    const result = await comparePassword('correct-password', hash)
    expect(result).toBe(true)
  })

  it('returns false for wrong password', async () => {
    const hash = await hashPassword('correct-password')
    const result = await comparePassword('wrong-password', hash)
    expect(result).toBe(false)
  })
})

describe('generateToken', () => {
  it('produces a 3-part dot-separated JWT string', () => {
    const token = generateToken('user-1', 'VOLUNTEER')
    expect(typeof token).toBe('string')
    expect(token.split('.').length).toBe(3)
  })

  it('encodes userId and role in the payload', () => {
    const token = generateToken('user-1', 'VOLUNTEER')
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    expect(payload.userId).toBe('user-1')
    expect(payload.role).toBe('VOLUNTEER')
  })

  it('sets a future expiration', () => {
    const token = generateToken('user-1', 'VOLUNTEER')
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000))
  })
})

describe('verifyToken', () => {
  it('decodes a valid token and returns userId and role', () => {
    const token = generateToken('user-1', 'ADMIN')
    const decoded = verifyToken(token) as { userId: string; role: string }
    expect(decoded.userId).toBe('user-1')
    expect(decoded.role).toBe('ADMIN')
  })

  it('throws on an expired token', () => {
    const token = jwt.sign({ userId: 'user-1', role: 'VOLUNTEER' }, TEST_SECRET, { expiresIn: '0s' })
    expect(() => verifyToken(token)).toThrow('Invalid token')
  })

  it('throws on a tampered token', () => {
    const token = generateToken('user-1', 'VOLUNTEER')
    const parts = token.split('.')
    const tampered = `${parts[0]}.${parts[1]}.invalidsignature`
    expect(() => verifyToken(tampered)).toThrow('Invalid token')
  })

  it('throws on a token signed with a different secret', () => {
    const token = jwt.sign({ userId: 'user-1', role: 'VOLUNTEER' }, 'different-secret')
    expect(() => verifyToken(token)).toThrow('Invalid token')
  })

  it('throws on garbage input', () => {
    expect(() => verifyToken('not-a-token')).toThrow('Invalid token')
  })
})
