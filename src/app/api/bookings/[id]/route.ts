import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { NextResponse } from 'next/server';

const adapter = new PrismaLibSql({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const booking = await prisma.booking.update({
    where: { id: Number(id) },
    data: { status: 'CANCELLED' },
  });

  return NextResponse.json(booking);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  if (body.action === 'checkin') {
    const booking = await prisma.booking.update({
      where: { id: Number(id) },
      data: {
        status: 'CHECKED_IN',
        checkedInAt: new Date(),
      },
    });
    return NextResponse.json(booking);
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}