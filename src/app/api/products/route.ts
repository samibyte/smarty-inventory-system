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

export async function GET(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.toLowerCase() || '';
  const categoryId = searchParams.get('categoryId') || '';
  const status = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  const db = await readDb();
  let products = db.products;

  if (search) products = products.filter((p) => p.name.toLowerCase().includes(search));
  if (categoryId) products = products.filter((p) => p.categoryId === categoryId);
  if (status) products = products.filter((p) => p.status === status);

  const total = products.length;
  const paginated = products.slice((page - 1) * limit, page * limit);

  return NextResponse.json({ data: paginated, total, page, limit });
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const db = await readDb();
  const now = new Date().toISOString();
  const product = {
    id: generateId(),
    ...parsed.data,
    status: parsed.data.stockQuantity === 0 ? 'out_of_stock' as const : parsed.data.status,
    createdAt: now,
    updatedAt: now,
  };
  db.products.push(product);

  // Check restock queue
  if (isLowStock(product.stockQuantity, product.minStockThreshold)) {
    const priority = calcPriority(product.stockQuantity, product.minStockThreshold);
    const existing = db.restockQueue.findIndex((r) => r.id === product.id);
    if (existing === -1) {
      db.restockQueue.push({
        id: product.id,
        productId: product.id,
        productName: product.name,
        currentStock: product.stockQuantity,
        minThreshold: product.minStockThreshold,
        priority,
        addedAt: now,
      });
      db.activityLogs.unshift({
        id: generateId(),
        action: 'restock_queue_added',
        description: `Product "${product.name}" added to Restock Queue`,
        userId: user.id,
        createdAt: now,
      });
    }
  }

  db.activityLogs.unshift({
    id: generateId(),
    action: 'product_created',
    description: `Product "${product.name}" created`,
    userId: user.id,
    createdAt: now,
  });
  await writeDb(db);

  return NextResponse.json({ data: product }, { status: 201 });
}
