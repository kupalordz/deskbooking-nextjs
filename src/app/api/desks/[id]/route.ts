import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { NextResponse } from 'next/server';

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.desk.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const desk = await prisma.desk.update({
    where: { id: Number(id) },
    data: {
      xPosition: body.xPosition,
      yPosition: body.yPosition,
    },
  });
  return NextResponse.json(desk);
}