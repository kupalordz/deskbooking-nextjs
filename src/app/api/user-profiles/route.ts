import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { NextResponse } from 'next/server';

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

export async function GET() {
  const profiles = await prisma.userProfile.findMany({
    include: { location: true, vehicles: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(profiles);
}

export async function POST(request: Request) {
  const body = await request.json();
  const profile = await prisma.userProfile.create({
    data: {
      name: body.name,
      email: body.email,
      role: body.role,
      group: body.group,
      locationId: body.locationId ? Number(body.locationId) : null,
    },
    include: { location: true, vehicles: true },
  });
  return NextResponse.json(profile);
}
