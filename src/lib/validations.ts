// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in

import { z } from 'zod';

export const volunteerProfileSchema = z.object({
  phone: z.string().optional(),
  location: z.string().optional(),
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  availability: z.string().optional(),
  bio: z.string().optional(),
});

export type VolunteerProfileFormData = z.infer<typeof volunteerProfileSchema>;

export const organizationProfileSchema = z.object({
  organizationName: z.string().min(1, 'Organization name is required'),
  contactPerson: z.string().optional(),
  registrationNumber: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
});

export type OrganizationProfileFormData = z.infer<typeof organizationProfileSchema>;