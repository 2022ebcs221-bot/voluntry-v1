// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

import { z } from 'zod';

export const volunteerProfileSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  image: z.string().optional(),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  availability: z.string().optional(),
  bio: z.string().optional(),
});

export type VolunteerProfileFormData = z.infer<typeof volunteerProfileSchema>;

export const organizationProfileSchema = z.object({
  userName: z.string().optional(),
  organizationName: z.string().min(1, 'Organization name is required'),
  image: z.string().optional(),
  registrationNumber: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
});

export type OrganizationProfileFormData = z.infer<typeof organizationProfileSchema>;

export const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  location: z.string().min(1, 'Location is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  requiredSkills: z.array(z.string()).optional().default([]),
  volunteerLimit: z.coerce.number().min(1, 'Volunteer limit must be at least 1'),
  image: z.string().optional(),
  questions: z.array(z.string()).optional().default([]),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export type EventFormData = z.infer<typeof eventSchema>;

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['VOLUNTEER', 'ORGANIZATION', 'ADMIN']).optional().default('VOLUNTEER'),
});