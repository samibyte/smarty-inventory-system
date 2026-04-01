import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readDb, writeDb } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { categorySchema } from '@/lib/validations/category.schema';
import { generateId } from '@/lib/utils/id';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await readDb();
  return NextResponse.json({ data: db.categories });
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const db = await readDb();
  if (db.categories.find((c) => c.name.toLowerCase() === parsed.data.name.toLowerCase())) {
    return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
  }

  const category = {
    id: generateId(),
    name: parsed.data.name,
    createdAt: new Date().toISOString(),
  };
  db.categories.push(category);
  db.activityLogs.unshift({
    id: generateId(),
    action: 'category_created',
    description: `Category "${category.name}" created`,
    userId: user.id,
    createdAt: new Date().toISOString(),
  });
  await writeDb(db);

  return NextResponse.json({ data: category }, { status: 201 });
}
