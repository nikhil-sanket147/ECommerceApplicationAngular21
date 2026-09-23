export interface OrderItemRequest {
  productId: string;
  sku: string;
  unitPrice: number;
  quantity: number;
}

export interface CreateOrderRequest {
  customerId: string;
  items: OrderItemRequest[];
}

export interface OrderItem {
  id?: string;
  productId: string;
  productName?: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  totalPrice?: number;
}

export interface Order {
  id: string;
  customerId: string;
  orderDate: string;
  status: OrderStatus | number | string;
  totalAmount: number;
  items: OrderItem[];
}

export enum OrderStatus {
  Pending = 0,
  StockReserved = 1,
  StockReservationFailed = 2,
  Paid = 3,
  Cancelled = 4,
  Completed = 5
}