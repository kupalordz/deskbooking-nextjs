import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { NextResponse } from 'next/server';

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

export async function GET() {
  const options = await prisma.dropdownOption.findMany({ orderBy: [{ category: 'asc' }, { value: 'asc' }] });
  return NextResponse.json(options);
}

export async function POST(request: Request) {
  const body = await request.json();
  try {
    const option = await prisma.dropdownOption.create({ data: { category: body.category, value: body.value } });
    return NextResponse.json(option);
  } catch {
    return NextResponse.json({ error: 'Already exists' }, { status: 400 });
  }
}
