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
  const floor = await prisma.floor.findUnique({ where: { id: Number(id) } });
  if (!floor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Clear floorId on all desks assigned to this floor
  await prisma.desk.updateMany({
    where: { floorId: floor.floorId },
    data: { floorId: '', xPosition: 0, yPosition: 0 },
  });

  await prisma.floor.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
