import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const safeName = Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
  const filePath = path.join(process.cwd(), 'public', 'floorplans', safeName);

  await writeFile(filePath, buffer);

  return NextResponse.json({ url: '/floorplans/' + safeName });
}