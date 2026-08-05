import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { NextResponse } from 'next/server';

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

export async function GET() {
  const locations = await prisma.location.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(locations);
}

export async function POST(request: Request) {
  const body = await request.json();
  const location = await prisma.location.create({
    data: { country: body.country, city: body.city, building: body.building, floor: body.floor, zone: body.zone },
  });
  return NextResponse.json(location);
}
