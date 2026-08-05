import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { NextResponse } from 'next/server';

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

export async function GET() {
  const shifts = await prisma.shiftSchedule.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(shifts);
}

export async function POST(request: Request) {
  const body = await request.json();
  const shift = await prisma.shiftSchedule.create({
    data: { name: body.name, startTime: body.startTime, endTime: body.endTime, days: body.days },
  });
  return NextResponse.json(shift);
}
