import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { NextResponse } from 'next/server';

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

export async function GET() {
  const bookings = await prisma.booking.findMany({
    where: { userId: 'local-user-001' },
    include: { desk: true },
  });
  return NextResponse.json(bookings);
}

export async function POST(request: Request) {
  const body = await request.json();

  const existing = await prisma.booking.findFirst({
    where: {
      deskId: Number(body.deskId),
      bookingDate: body.bookingDate,
      status: { not: 'CANCELLED' },
    },
  });

  if (existing) {
    return NextResponse.json({ error: 'Desk already booked for this date' }, { status: 400 });
  }

  const booking = await prisma.booking.create({
    data: {
      deskId: Number(body.deskId),
      userId: 'local-user-001',
      userEmail: 'local@albertsons.com',
      bookingDate: body.bookingDate,
      status: 'CONFIRMED',
    },
    include: { desk: true },
  });

  return NextResponse.json(booking);
}