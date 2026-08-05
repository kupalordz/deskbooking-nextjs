import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { NextResponse } from 'next/server';

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

export async function GET() {
  const bookings = await prisma.parkingBooking.findMany({
    where: { userId: 'local-user-001' },
    include: { spot: true },
    orderBy: { bookingDate: 'desc' },
  });
  return NextResponse.json(bookings);
}

export async function POST(request: Request) {
  const body = await request.json();
  const startTime = (body.startTime as string) || '';
  const endTime = (body.endTime as string) || '';

  let existing;
  if (startTime && endTime) {
    existing = await prisma.parkingBooking.findFirst({
      where: {
        spotId: Number(body.spotId),
        status: { not: 'CANCELLED' },
        AND: [
          { startTime: { not: '' } },
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
    });
  } else {
    existing = await prisma.parkingBooking.findFirst({
      where: {
        spotId: Number(body.spotId),
        bookingDate: body.bookingDate,
        status: { not: 'CANCELLED' },
      },
    });
  }

  if (existing) {
    return NextResponse.json({ error: 'Spot already booked for this time' }, { status: 400 });
  }

  const booking = await prisma.parkingBooking.create({
    data: {
      spotId: Number(body.spotId),
      userId: 'local-user-001',
      userEmail: 'local@albertsons.com',
      bookingDate: body.bookingDate,
      startTime,
      endTime,
      status: 'CONFIRMED',
    },
    include: { spot: true },
  });

  return NextResponse.json(booking);
}
