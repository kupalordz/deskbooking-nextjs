import { createClient } from '@libsql/client';
import { NextResponse } from 'next/server';

export async function GET() {
  const client = createClient({ url: process.env.DATABASE_URL! });

  const statements = [
    `CREATE TABLE IF NOT EXISTS "ParkingSpot" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "zone" TEXT NOT NULL,
      "active" BOOLEAN NOT NULL DEFAULT true
    )`,
    `CREATE TABLE IF NOT EXISTS "ParkingBooking" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "spotId" INTEGER NOT NULL,
      "userId" TEXT NOT NULL,
      "userEmail" TEXT NOT NULL,
      "bookingDate" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
      "qrToken" TEXT NOT NULL,
      "checkedInAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ParkingBooking_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "ParkingSpot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )`,
  ];

  const results = [];
  for (const sql of statements) {
    try {
      await client.execute(sql);
      results.push({ sql: sql.trim().slice(0, 60), ok: true });
    } catch (e: unknown) {
      results.push({ sql: sql.trim().slice(0, 60), ok: false, error: e instanceof Error ? e.message : String(e) });
    }
  }

  return NextResponse.json({ results });
}
