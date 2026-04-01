import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readDb } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { getLast7Days } from '@/lib/utils/date';
import { isLowStock } from '@/lib/utils/stock';

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
  const today = new Date().toISOString().split('T')[0];

  const todayOrders = db.orders.filter((o) => o.createdAt.startsWith(today));
  const totalOrdersToday = todayOrders.length;
  const revenueToday = todayOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const pendingOrders = db.orders.filter((o) => o.status === 'pending').length;
  const completedOrders = db.orders.filter((o) => o.status === 'delivered').length;
  const lowStockCount = db.restockQueue.length;

  const recentActivity = db.activityLogs.slice(0, 10);

  const productSummary = db.products.slice(0, 8).map((p) => ({
    id: p.id,
    name: p.name,
    stockQuantity: p.stockQuantity,
    status: p.status,
    isLow: isLowStock(p.stockQuantity, p.minStockThreshold),
  }));

  const last7 = getLast7Days();
  const revenueChart = last7.map((date) => ({
    date,
    revenue: db.orders
      .filter((o) => o.createdAt.startsWith(date) && o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.totalPrice, 0),
  }));

  return NextResponse.json({
    data: {
      totalOrdersToday,
      pendingOrders,
      completedOrders,
      lowStockCount,
      revenueToday,
      recentActivity,
      productSummary,
      revenueChart,
    },
  });
}
