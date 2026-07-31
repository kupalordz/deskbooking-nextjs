import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { NextResponse } from 'next/server';

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

export async function GET() {
  const desks = await prisma.desk.findMany();
  return NextResponse.json(desks);
}

export async function POST(request: Request) {
  const body = await request.json();
  const desk = await prisma.desk.create({ data: body });
  return NextResponse.json(desk);
}