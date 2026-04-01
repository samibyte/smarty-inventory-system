import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readDb, writeDb } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { productSchema } from '@/lib/validations/product.schema';
import { generateId } from '@/lib/utils/id';
import { calcPriority, isLowStock } from '@/lib/utils/stock';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = await readDb();
  const product = db.products.find((p) => p.id === id);
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  return NextResponse.json({ data: product });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const db = await readDb();
  const idx = db.products.findIndex((p) => p.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const now = new Date().toISOString();
  const updated = {
    ...db.products[idx],
    ...parsed.data,
    status: parsed.data.stockQuantity === 0 ? 'out_of_stock' as const : (parsed.data.stockQuantity > 0 && db.products[idx].status === 'out_of_stock' ? 'active' as const : parsed.data.status),
    updatedAt: now,
  };
  db.products[idx] = updated;

  // Re-evaluate restock queue
  const qIdx = db.restockQueue.findIndex((r) => r.id === id);
  if (isLowStock(updated.stockQuantity, updated.minStockThreshold)) {
    const priority = calcPriority(updated.stockQuantity, updated.minStockThreshold);
    if (qIdx === -1) {
      db.restockQueue.push({
        id: updated.id,
        productId: updated.id,
        productName: updated.name,
        currentStock: updated.stockQuantity,
        minThreshold: updated.minStockThreshold,
        priority,
        addedAt: now,
      });
      db.activityLogs.unshift({
        id: generateId(),
        action: 'restock_queue_added',
        description: `Product "${updated.name}" added to Restock Queue`,
        userId: user.id,
        createdAt: now,
      });
    } else {
      db.restockQueue[qIdx] = { ...db.restockQueue[qIdx], currentStock: updated.stockQuantity, priority, productName: updated.name };
    }
  } else if (qIdx !== -1) {
    db.restockQueue.splice(qIdx, 1);
    db.activityLogs.unshift({
      id: generateId(),
      action: 'restock_queue_removed',
      description: `Product "${updated.name}" removed from Restock Queue`,
      userId: user.id,
      createdAt: now,
    });
  }

  db.activityLogs.unshift({
    id: generateId(),
    action: 'product_updated',
    description: `Product "${updated.name}" updated`,
    userId: user.id,
    createdAt: now,
  });
  await writeDb(db);

  return NextResponse.json({ data: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = await readDb();
  const hasActiveOrders = db.orders.some(
    (o) => o.status !== 'cancelled' && o.status !== 'delivered' && o.items.some((i) => i.productId === id)
  );
  if (hasActiveOrders) {
    return NextResponse.json({ error: 'Cannot delete product with active orders' }, { status: 409 });
  }

  const idx = db.products.findIndex((p) => p.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const name = db.products[idx].name;
  db.products.splice(idx, 1);
  db.restockQueue = db.restockQueue.filter((r) => r.id !== id);

  db.activityLogs.unshift({
    id: generateId(),
    action: 'product_deleted',
    description: `Product "${name}" deleted`,
    userId: user.id,
    createdAt: new Date().toISOString(),
  });
  await writeDb(db);

  return NextResponse.json({ message: 'Deleted' });
}
