import { createClient } from '@libsql/client';
import { NextResponse } from 'next/server';

const db = createClient({ url: process.env.DATABASE_URL! });

export async function GET() {
  await db.execute('DELETE FROM "ParkingBooking"');
  await db.execute('DELETE FROM "Booking"');
  return NextResponse.json({ ok: true, message: 'All bookings cleared' });
}
