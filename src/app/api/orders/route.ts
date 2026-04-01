import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readDb, writeDb } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { orderSchema } from '@/lib/validations/order.schema';
import { generateId } from '@/lib/utils/id';
import { calcPriority, isLowStock } from '@/lib/utils/stock';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || '';
  const search = searchParams.get('search')?.toLowerCase() || '';
  const date = searchParams.get('date') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  const db = await readDb();
  let orders = [...db.orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (status && status !== 'all') orders = orders.filter((o) => o.status === status);
  if (search) orders = orders.filter((o) => o.customerName.toLowerCase().includes(search) || o.orderNumber.toLowerCase().includes(search));
  if (date) orders = orders.filter((o) => o.createdAt.startsWith(date));

  const total = orders.length;
  const paginated = orders.slice((page - 1) * limit, page * limit);

  return NextResponse.json({ data: paginated, total, page, limit });
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { customerName, items } = parsed.data;
  const db = await readDb();

  // Conflict detection: duplicate product IDs
  const productIds = items.map((i) => i.productId);
  const uniqueIds = new Set(productIds);
  if (uniqueIds.size !== productIds.length) {
    return NextResponse.json({ error: 'This product is already added to the order.' }, { status: 400 });
  }

  // Validate each item
  for (const item of items) {
    const product = db.products.find((p) => p.id === item.productId);
    if (!product) {
      return NextResponse.json({ error: `Product not found` }, { status: 404 });
    }
    if (product.status === 'out_of_stock') {
      return NextResponse.json({ error: `"${product.name}" is currently unavailable.` }, { status: 400 });
    }
    if (item.quantity > product.stockQuantity) {
      return NextResponse.json({ error: `Only ${product.stockQuantity} items available for "${product.name}".` }, { status: 400 });
    }
  }

  const now = new Date().toISOString();
  db.meta.orderCounter += 1;
  const orderNumber = `ORD-${db.meta.orderCounter}`;

  // Build order items with snapshots
  const orderItems = items.map((item) => {
    const product = db.products.find((p) => p.id === item.productId)!;
    return {
      productId: item.productId,
      productName: product.name,
      quantity: item.quantity,
      unitPrice: product.price,
      subtotal: Math.round(item.quantity * product.price * 100) / 100,
    };
  });

  const totalPrice = Math.round(orderItems.reduce((sum, i) => sum + i.subtotal, 0) * 100) / 100;

  const order = {
    id: generateId(),
    orderNumber,
    customerName,
    items: orderItems,
    totalPrice,
    status: 'pending' as const,
    createdAt: now,
    updatedAt: now,
  };
  db.orders.push(order);

  // Deduct stock and update restock queue
  for (const item of orderItems) {
    const pIdx = db.products.findIndex((p) => p.id === item.productId);
    if (pIdx === -1) continue;
    db.products[pIdx].stockQuantity -= item.quantity;
    db.products[pIdx].updatedAt = now;

    if (db.products[pIdx].stockQuantity === 0) {
      db.products[pIdx].status = 'out_of_stock';
    }

    const stock = db.products[pIdx].stockQuantity;
    const threshold = db.products[pIdx].minStockThreshold;

    if (isLowStock(stock, threshold)) {
      const priority = calcPriority(stock, threshold);
      const qIdx = db.restockQueue.findIndex((r) => r.id === item.productId);
      if (qIdx === -1) {
        db.restockQueue.push({
          id: item.productId,
          productId: item.productId,
          productName: item.productName,
          currentStock: stock,
          minThreshold: threshold,
          priority,
          addedAt: now,
        });
        db.activityLogs.unshift({
          id: generateId(),
          action: 'restock_queue_added',
          description: `Product "${item.productName}" added to Restock Queue`,
          userId: user.id,
          createdAt: now,
        });
      } else {
        db.restockQueue[qIdx].currentStock = stock;
        db.restockQueue[qIdx].priority = priority;
      }
    }
  }

  db.activityLogs.unshift({
    id: generateId(),
    action: 'order_created',
    description: `Order ${orderNumber} created by ${user.name}`,
    userId: user.id,
    createdAt: now,
  });
  await writeDb(db);

  return NextResponse.json({ data: order }, { status: 201 });
}
