import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readDb, writeDb } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { generateId } from '@/lib/utils/id';
import { calcPriority, isLowStock } from '@/lib/utils/stock';
import { z } from 'zod';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

const statusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = await readDb();
  const order = db.orders.find((o) => o.id === id);
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  return NextResponse.json({ data: order });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const db = await readDb();
  const oIdx = db.orders.findIndex((o) => o.id === id);
  if (oIdx === -1) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const order = db.orders[oIdx];
  const newStatus = parsed.data.status;
  const now = new Date().toISOString();

  // Restore stock if cancelling
  if (newStatus === 'cancelled' && order.status !== 'cancelled') {
    for (const item of order.items) {
      const pIdx = db.products.findIndex((p) => p.id === item.productId);
      if (pIdx === -1) continue;
      db.products[pIdx].stockQuantity += item.quantity;
      db.products[pIdx].updatedAt = now;

      if (db.products[pIdx].status === 'out_of_stock' && db.products[pIdx].stockQuantity > 0) {
        db.products[pIdx].status = 'active';
      }

      const stock = db.products[pIdx].stockQuantity;
      const threshold = db.products[pIdx].minStockThreshold;
      const qIdx = db.restockQueue.findIndex((r) => r.id === item.productId);

      if (!isLowStock(stock, threshold) && qIdx !== -1) {
        db.restockQueue.splice(qIdx, 1);
        db.activityLogs.unshift({
          id: generateId(),
          action: 'restock_queue_removed',
          description: `Product "${item.productName}" removed from Restock Queue (order cancelled)`,
          userId: user.id,
          createdAt: now,
        });
      } else if (isLowStock(stock, threshold) && qIdx !== -1) {
        db.restockQueue[qIdx].currentStock = stock;
        db.restockQueue[qIdx].priority = calcPriority(stock, threshold);
      }
    }

    db.activityLogs.unshift({
      id: generateId(),
      action: 'order_cancelled',
      description: `Order ${order.orderNumber} cancelled`,
      userId: user.id,
      createdAt: now,
    });
  } else {
    db.activityLogs.unshift({
      id: generateId(),
      action: 'order_status_updated',
      description: `Order ${order.orderNumber} marked as ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
      userId: user.id,
      createdAt: now,
    });
  }

  db.orders[oIdx] = { ...order, status: newStatus, updatedAt: now };
  await writeDb(db);

  return NextResponse.json({ data: db.orders[oIdx] });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = await readDb();
  const idx = db.orders.findIndex((o) => o.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  db.orders.splice(idx, 1);
  await writeDb(db);

  return NextResponse.json({ message: 'Deleted' });
}
