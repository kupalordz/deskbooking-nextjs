import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { NextResponse } from 'next/server';

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

export async function GET() {
  const spots = await prisma.parkingSpot.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json(spots);
}

export async function POST(request: Request) {
  const body = await request.json();
  const spot = await prisma.parkingSpot.create({
    data: {
      name: body.name,
      type: body.type,
      zone: body.zone ?? '',
      country: body.country ?? '',
      city: body.city ?? '',
      building: body.building ?? '',
      floor: body.floor ?? '',
      floorId: body.floorId ?? '',
      xPosition: body.xPosition ?? 0,
      yPosition: body.yPosition ?? 0,
    },
  });
  return NextResponse.json(spot);
}
