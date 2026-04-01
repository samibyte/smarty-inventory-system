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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const db = await readDb();
  const idx = db.categories.findIndex((c) => c.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

  db.categories[idx].name = parsed.data.name;
  await writeDb(db);

  return NextResponse.json({ data: db.categories[idx] });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = await readDb();
  const hasProducts = db.products.some((p) => p.categoryId === id);
  if (hasProducts) {
    return NextResponse.json({ error: 'Cannot delete category with existing products' }, { status: 409 });
  }

  const idx = db.categories.findIndex((c) => c.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

  const name = db.categories[idx].name;
  db.categories.splice(idx, 1);
  db.activityLogs.unshift({
    id: generateId(),
    action: 'category_deleted',
    description: `Category "${name}" deleted`,
    userId: user.id,
    createdAt: new Date().toISOString(),
  });
  await writeDb(db);

  return NextResponse.json({ message: 'Deleted' });
}
