import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const safeName = Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
  const blob = await put(safeName, file, { access: 'public' });

  return NextResponse.json({ url: blob.url });
}