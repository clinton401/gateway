// src/config/db.ts
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
    if (!process.env.DATABASE_URL) {
        throw new Error('CRITICAL: DATABASE_URL environment variable is missing.')
    }

    // 1. Create a standard native Postgres connection pool
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })

    // 2. Wrap the pool in Prisma's driver adapter
    const adapter = new PrismaPg(pool)

    // 3. Inject the adapter into the Prisma Client
    return new PrismaClient({
        adapter,
        log: ['error', 'warn']
    })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
}