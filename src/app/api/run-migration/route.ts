import { createClient } from '@libsql/client';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const stmts = [
    `ALTER TABLE "ParkingSpot" ADD COLUMN "country" TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE "ParkingSpot" ADD COLUMN "city" TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE "ParkingSpot" ADD COLUMN "building" TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE "ParkingSpot" ADD COLUMN "floor" TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE "ParkingSpot" ADD COLUMN "floorId" TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE "ParkingSpot" ADD COLUMN "xPosition" REAL NOT NULL DEFAULT 0`,
    `ALTER TABLE "ParkingSpot" ADD COLUMN "yPosition" REAL NOT NULL DEFAULT 0`,
  ];

  const results: string[] = [];
  for (const sql of stmts) {
    try {
      await client.execute(sql);
      results.push(`OK: ${sql.slice(0, 60)}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('duplicate column')) {
        results.push(`SKIP (already exists): ${sql.slice(0, 60)}`);
      } else {
        results.push(`ERR: ${msg}`);
      }
    }
  }

  return NextResponse.json({ results });
}
