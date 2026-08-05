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
  const updated = await prisma.userProfile.update({
    where: { id: Number(id) },
    data: {
      name: body.name,
      email: body.email,
      role: body.role,
      group: body.group,
      locationId: body.locationId ? Number(body.locationId) : null,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.vehicle.deleteMany({ where: { userProfileId: Number(id) } });
  await prisma.userProfile.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
