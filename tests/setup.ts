import 'dotenv/config'
import { execSync } from 'child_process'

beforeAll(async () => {
  try {
    execSync('npx prisma migrate deploy', { stdio: 'pipe' })
  } catch {
    // migrations may already be applied
  }
})

export { prisma } from '../src/lib/prisma'
