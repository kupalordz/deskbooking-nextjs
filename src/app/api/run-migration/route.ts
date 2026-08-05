import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { NextResponse } from 'next/server';

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

export async function GET() {
  const results: string[] = [];

  const statements = [
    `CREATE TABLE IF NOT EXISTS "Location" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "country" TEXT NOT NULL,
      "city" TEXT NOT NULL,
      "building" TEXT NOT NULL,
      "floor" TEXT NOT NULL,
      "zone" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "UserProfile" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "role" TEXT NOT NULL,
      "group" TEXT NOT NULL,
      "locationId" INTEGER,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "UserProfile_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "Vehicle" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "userProfileId" INTEGER NOT NULL,
      "type" TEXT NOT NULL,
      "plateNumber" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Vehicle_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "ShiftSchedule" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL,
      "startTime" TEXT NOT NULL,
      "endTime" TEXT NOT NULL,
      "days" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "UserProfile_email_key" ON "UserProfile"("email")`,
    `ALTER TABLE "Desk" ADD COLUMN "hasMonitor" BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE "Desk" ADD COLUMN "hasKeyboard" BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE "Desk" ADD COLUMN "hasPedestal" BOOLEAN NOT NULL DEFAULT false`,
  ];

  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
      results.push(`OK: ${sql.trim().split('\n')[0].slice(0, 60)}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push(`SKIP (${msg.slice(0, 80)}): ${sql.trim().split('\n')[0].slice(0, 40)}`);
    }
  }

  return NextResponse.json({ done: true, results });
}
