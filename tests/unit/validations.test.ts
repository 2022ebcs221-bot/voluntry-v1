// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

import { describe, it, expect } from 'vitest'
import {
  volunteerProfileSchema,
  organizationProfileSchema,
  eventSchema,
  registerSchema,
} from '@/lib/validations'

describe('volunteerProfileSchema', () => {
  it('accepts a valid profile with all fields', () => {
    const data = {
      phone: '1234567890',
      location: 'New York',
      skills: ['Teaching', 'Cooking'],
      interests: ['Education', 'Health'],
      availability: 'Weekends',
      bio: 'I love helping others.',
    }
    const result = volunteerProfileSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('accepts an empty profile (all optional)', () => {
    const result = volunteerProfileSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('strips unknown fields', () => {
    const result = volunteerProfileSchema.safeParse({ extraField: 'value' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).not.toHaveProperty('extraField')
    }
  })
})

describe('organizationProfileSchema', () => {
  it('accepts a valid profile', () => {
    const data = {
      organizationName: 'Helping Hands',
      contactPerson: 'John Doe',
      registrationNumber: 'REG123',
      address: '123 Main St',
      description: 'We help people.',
      website: 'https://helpinghands.org',
    }
    const result = organizationProfileSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  it('rejects missing organization name', () => {
    const result = organizationProfileSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('accepts empty website string', () => {
    const data = {
      organizationName: 'Test Org',
      website: '',
    }
    const result = organizationProfileSchema.safeParse(data)
    expect(result.success).toBe(true)
  })
})

describe('eventSchema', () => {
  const validEvent = {
    title: 'Community Cleanup',
    description: 'Cleaning the park',
    category: 'Environment',
    location: 'Central Park',
    startDate: '2026-06-01T09:00',
    endDate: '2026-06-01T17:00',
    requiredSkills: ['Cleaning', 'Gardening'],
    volunteerLimit: 20,
    status: 'PUBLISHED',
  }

  it('accepts a valid event', () => {
    const result = eventSchema.safeParse(validEvent)
    expect(result.success).toBe(true)
  })

  it('rejects missing title', () => {
    const { title, ...rest } = validEvent
    const result = eventSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects zero volunteer limit', () => {
    const result = eventSchema.safeParse({ ...validEvent, volunteerLimit: 0 })
    expect(result.success).toBe(false)
  })

  it('defaults status to DRAFT when not provided', () => {
    const { status, ...rest } = validEvent
    const result = eventSchema.safeParse(rest)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('DRAFT')
    }
  })

  it('defaults requiredSkills to empty array when not provided', () => {
    const { requiredSkills, ...rest } = validEvent
    const result = eventSchema.safeParse(rest)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.requiredSkills).toEqual([])
    }
  })

  it('rejects invalid status', () => {
    const result = eventSchema.safeParse({ ...validEvent, status: 'INVALID' })
    expect(result.success).toBe(false)
  })

  it('rejects endDate before startDate', () => {
    const result = eventSchema.safeParse({
      ...validEvent,
      startDate: '2026-07-01T17:00',
      endDate: '2026-07-01T09:00',
    })
    expect(result.success).toBe(false)
  })

  it('accepts endDate after startDate', () => {
    const result = eventSchema.safeParse({
      ...validEvent,
      startDate: '2026-07-01T09:00',
      endDate: '2026-07-01T17:00',
    })
    expect(result.success).toBe(true)
  })
})

describe('registerSchema', () => {
  const validRegistration = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'secret123',
    role: 'VOLUNTEER',
  }

  it('accepts a valid registration', () => {
    const result = registerSchema.safeParse(validRegistration)
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({ ...validRegistration, email: 'notanemail' })
    expect(result.success).toBe(false)
  })

  it('rejects short password (< 6)', () => {
    const result = registerSchema.safeParse({ ...validRegistration, password: '12345' })
    expect(result.success).toBe(false)
  })

  it('rejects empty name', () => {
    const result = registerSchema.safeParse({ ...validRegistration, name: '' })
    expect(result.success).toBe(false)
  })

  it('requires role to be a valid enum value', () => {
    const result = registerSchema.safeParse({ ...validRegistration, role: 'INVALID' })
    expect(result.success).toBe(false)
  })

  it('defaults role to VOLUNTEER when not provided', () => {
    const { role, ...rest } = validRegistration
    const result = registerSchema.safeParse(rest)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.role).toBe('VOLUNTEER')
    }
  })
})
