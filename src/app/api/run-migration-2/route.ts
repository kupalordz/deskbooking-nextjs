import { createClient } from '@libsql/client';
import { NextResponse } from 'next/server';

export async function GET() {
  const client = createClient({ url: process.env.DATABASE_URL! });

  const statements = [
    `CREATE TABLE IF NOT EXISTS "DropdownOption" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "category" TEXT NOT NULL,
      "value" TEXT NOT NULL,
      UNIQUE("category", "value")
    )`,
  ];

  const results = [];
  for (const sql of statements) {
    try {
      await client.execute(sql);
      results.push({ sql: sql.slice(0, 60), ok: true });
    } catch (e: unknown) {
      results.push({ sql: sql.slice(0, 60), ok: false, error: e instanceof Error ? e.message : String(e) });
    }
  }

  return NextResponse.json({ results });
}
