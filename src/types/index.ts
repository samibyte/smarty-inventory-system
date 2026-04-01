// --- Auth ---
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'manager';
  createdAt: string;
}

export type SafeUser = Omit<User, 'passwordHash'>;

// --- Category ---
export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

// --- Product ---
export type ProductStatus = 'active' | 'out_of_stock';

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  stockQuantity: number;
  minStockThreshold: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

// --- Order ---
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

// --- Restock Queue ---
export type RestockPriority = 'high' | 'medium' | 'low';

export interface RestockEntry {
  id: string;
  productId: string;
  productName: string;
  currentStock: number;
  minThreshold: number;
  priority: RestockPriority;
  addedAt: string;
}

// --- Activity Log ---
export type ActivityAction =
  | 'order_created'
  | 'order_status_updated'
  | 'order_cancelled'
  | 'product_created'
  | 'product_updated'
  | 'stock_updated'
  | 'product_restocked'
  | 'restock_queue_added'
  | 'restock_queue_removed'
  | 'category_created'
  | 'category_deleted'
  | 'product_deleted';

export interface ActivityLog {
  id: string;
  action: ActivityAction;
  description: string;
  userId: string;
  createdAt: string;
}

// --- DB Shape ---
export interface Database {
  users: User[];
  categories: Category[];
  products: Product[];
  orders: Order[];
  restockQueue: RestockEntry[];
  activityLogs: ActivityLog[];
  meta: {
    orderCounter: number;
  };
}

// --- API Response ---
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

// --- Dashboard ---
export interface DashboardStats {
  totalOrdersToday: number;
  pendingOrders: number;
  completedOrders: number;
  lowStockCount: number;
  revenueToday: number;
  recentActivity: ActivityLog[];
  productSummary: {
    id: string;
    name: string;
    stockQuantity: number;
    status: ProductStatus;
    isLow: boolean;
  }[];
  revenueChart: { date: string; revenue: number }[];
}
