import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

export async function GET() {
  const stmts = [
    `ALTER TABLE "ParkingSpot" ADD COLUMN "country" TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE "ParkingSpot" ADD COLUMN "city" TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE "ParkingSpot" ADD COLUMN "building" TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE "ParkingSpot" ADD COLUMN "floor" TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE "ParkingSpot" ADD COLUMN "floorId" TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE "ParkingSpot" ADD COLUMN "xPosition" REAL NOT NULL DEFAULT 0`,
    `ALTER TABLE "ParkingSpot" ADD COLUMN "yPosition" REAL NOT NULL DEFAULT 0`,
    `ALTER TABLE "Floor" ADD COLUMN "isParking" INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE "Booking" ADD COLUMN "startTime" TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE "Booking" ADD COLUMN "endTime" TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE "ParkingBooking" ADD COLUMN "startTime" TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE "ParkingBooking" ADD COLUMN "endTime" TEXT NOT NULL DEFAULT ''`,
  ];

  const results: string[] = [];
  for (const sql of stmts) {
    try {
      await prisma.$executeRawUnsafe(sql);
      results.push(`OK: ${sql.slice(0, 60)}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.toLowerCase().includes('duplicate column') || msg.toLowerCase().includes('already exists')) {
        results.push(`SKIP (already exists): ${sql.slice(0, 60)}`);
      } else {
        results.push(`ERR: ${msg}`);
      }
    }
  }

  return NextResponse.json({ results });
}
