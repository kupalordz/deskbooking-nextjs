import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { NextResponse } from 'next/server';

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

export async function POST(request: Request) {
  const body = await request.json();
  const vehicle = await prisma.vehicle.create({
    data: {
      userProfileId: Number(body.userProfileId),
      type: body.type,
      plateNumber: body.plateNumber,
    },
  });
  return NextResponse.json(vehicle);
}
