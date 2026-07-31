import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { NextResponse } from 'next/server';

const adapter = new PrismaLibSql({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

export async function GET() {
  const floors = await prisma.floor.findMany();
  return NextResponse.json(floors);
}

export async function POST(request: Request) {
  const body = await request.json();
  const floor = await prisma.floor.create({
    data: {
      floorId: body.floorId,
      name: body.name,
      imageUrl: body.imageUrl,
    },
  });
  return NextResponse.json(floor);
}