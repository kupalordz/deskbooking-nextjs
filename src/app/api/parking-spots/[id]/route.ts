import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { NextResponse } from 'next/server';

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.type !== undefined) data.type = body.type;
  if (body.zone !== undefined) data.zone = body.zone;
  if (body.active !== undefined) data.active = body.active;
  if (body.country !== undefined) data.country = body.country;
  if (body.city !== undefined) data.city = body.city;
  if (body.building !== undefined) data.building = body.building;
  if (body.floor !== undefined) data.floor = body.floor;
  if (body.floorId !== undefined) data.floorId = body.floorId;
  if (body.xPosition !== undefined) data.xPosition = body.xPosition;
  if (body.yPosition !== undefined) data.yPosition = body.yPosition;
  const updated = await prisma.parkingSpot.update({ where: { id: Number(id) }, data });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.parkingBooking.deleteMany({ where: { spotId: Number(id) } });
  await prisma.parkingSpot.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
