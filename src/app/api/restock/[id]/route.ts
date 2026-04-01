import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readDb, writeDb } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { generateId } from '@/lib/utils/id';
import { isLowStock } from '@/lib/utils/stock';
import { z } from 'zod';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

const restockSchema = z.object({
  quantity: z.number().int().positive('Quantity must be positive'),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = restockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const db = await readDb();
  const pIdx = db.products.findIndex((p) => p.id === id);
  if (pIdx === -1) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const now = new Date().toISOString();
  db.products[pIdx].stockQuantity += parsed.data.quantity;
  db.products[pIdx].updatedAt = now;

  if (db.products[pIdx].stockQuantity > 0) {
    db.products[pIdx].status = 'active';
  }

  const stock = db.products[pIdx].stockQuantity;
  const threshold = db.products[pIdx].minStockThreshold;
  const qIdx = db.restockQueue.findIndex((r) => r.id === id);

  if (!isLowStock(stock, threshold) && qIdx !== -1) {
    db.restockQueue.splice(qIdx, 1);
    db.activityLogs.unshift({
      id: generateId(),
      action: 'restock_queue_removed',
      description: `Product "${db.products[pIdx].name}" removed from Restock Queue`,
      userId: user.id,
      createdAt: now,
    });
  } else if (isLowStock(stock, threshold) && qIdx !== -1) {
    db.restockQueue[qIdx].currentStock = stock;
  }

  db.activityLogs.unshift({
    id: generateId(),
    action: 'product_restocked',
    description: `Stock updated for "${db.products[pIdx].name}" (+${parsed.data.quantity} units, now ${stock})`,
    userId: user.id,
    createdAt: now,
  });
  await writeDb(db);

  return NextResponse.json({ data: db.products[pIdx] });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = await readDb();
  const qIdx = db.restockQueue.findIndex((r) => r.id === id);
  if (qIdx === -1) return NextResponse.json({ error: 'Not found in queue' }, { status: 404 });

  const name = db.restockQueue[qIdx].productName;
  db.restockQueue.splice(qIdx, 1);
  db.activityLogs.unshift({
    id: generateId(),
    action: 'restock_queue_removed',
    description: `Product "${name}" manually removed from Restock Queue`,
    userId: user.id,
    createdAt: new Date().toISOString(),
  });
  await writeDb(db);

  return NextResponse.json({ message: 'Removed' });
}
