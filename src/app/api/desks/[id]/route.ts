import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { NextResponse } from 'next/server';

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

export async function DELETE(
  _req: Request,
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
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.zone !== undefined) data.zone = body.zone;
  if (body.floorId !== undefined) data.floorId = body.floorId;
  if (body.buildingId !== undefined) data.buildingId = body.buildingId;
  if (body.xPosition !== undefined) data.xPosition = body.xPosition;
  if (body.yPosition !== undefined) data.yPosition = body.yPosition;
  if (body.active !== undefined) data.active = body.active;
  if (body.restricted !== undefined) data.restricted = body.restricted;
  if (body.hasMonitor !== undefined) data.hasMonitor = body.hasMonitor;
  if (body.hasKeyboard !== undefined) data.hasKeyboard = body.hasKeyboard;
  if (body.hasPedestal !== undefined) data.hasPedestal = body.hasPedestal;
  const desk = await prisma.desk.update({ where: { id: Number(id) }, data });
  return NextResponse.json(desk);
}
