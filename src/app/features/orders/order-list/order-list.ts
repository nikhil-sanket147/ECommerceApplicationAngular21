import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../order.service';
import { AuthService } from '../../auth/auth.service';
import { Order, OrderStatus } from '../../../core/models/order.model';
import { ToastService } from '../../../core/services/toast.service';

type SortColumn = 'id' | 'customer' | 'sku' | 'items' | 'total' | 'status';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './order-list.html',
  styleUrl: './order-list.css'
})
export class OrderList implements OnInit {
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  orders = signal<Order[]>([]);
  isLoading = signal<boolean>(false);
  selectedOrder = signal<Order | null>(null);
  viewMode = signal<'table' | 'grid'>('table');

  // Search, Filter & Sort
  searchQuery = signal<string>('');
  selectedStatusFilter = signal<string>('ALL');
  sortColumn = signal<SortColumn>('id');
  sortDirection = signal<SortDirection>('desc');

  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(8);
  pageSizeOptions = [8, 12, 24];

  isAdmin = computed(() => this.authService.currentUser()?.role?.toLowerCase() === 'admin');

  // Summary Metrics
  totalOrdersCount = computed(() => this.orders().length);

  completedCount = computed(() => 
    this.orders().filter(o => 
      Number(o.status) === OrderStatus.Completed || 
      Number(o.status) === OrderStatus.Paid || 
      o.status === 'Completed' || 
      o.status === 'Paid'
    ).length
  );

  pendingCount = computed(() => 
    this.orders().filter(o => 
      Number(o.status) === OrderStatus.Pending || 
      Number(o.status) === OrderStatus.StockReserved || 
      o.status === 'Pending' || 
      o.status === 'StockReserved'
    ).length
  );

  cancelledCount = computed(() => 
    this.orders().filter(o => 
      Number(o.status) === OrderStatus.Cancelled || 
      Number(o.status) === OrderStatus.StockReservationFailed || 
      o.status === 'Cancelled' || 
      o.status === 'StockReservationFailed'
    ).length
  );

  filteredOrders = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const statusFilter = this.selectedStatusFilter();
    const col = this.sortColumn();
    const dir = this.sortDirection();

    let list = this.orders().filter((order) => {
      const numericStatus = Number(order.status);
      const matchesStatus = statusFilter === 'ALL' || 
        String(numericStatus) === statusFilter || 
        String(order.status) === statusFilter;

      const orderIdMatch = order.id?.toLowerCase().includes(q);
      const skuMatch = order.items?.some(i => i.sku?.toLowerCase().includes(q) || i.productName?.toLowerCase().includes(q));
      const customerMatch = order.customerId?.toLowerCase().includes(q);

      return matchesStatus && (!q || orderIdMatch || skuMatch || customerMatch);
    });

    return [...list].sort((a, b) => {
      let comp = 0;
      if (col === 'id') comp = a.id.localeCompare(b.id);
      if (col === 'customer') comp = (a.customerId || '').localeCompare(b.customerId || '');
      if (col === 'sku') comp = this.getSkusSummary(a).localeCompare(this.getSkusSummary(b));
      if (col === 'items') comp = (a.items?.length || 0) - (b.items?.length || 0);
      if (col === 'total') comp = (a.totalAmount || 0) - (b.totalAmount || 0);
      if (col === 'status') comp = Number(a.status) - Number(b.status);
      return dir === 'asc' ? comp : -comp;
    });
  });

  paginatedOrders = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredOrders().slice(start, start + this.pageSize());
  });

  totalPages = computed(() => Math.ceil(this.filteredOrders().length / this.pageSize()) || 1);

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading.set(true);

    const user = this.authService.currentUser();
    const fetch$ = this.isAdmin() 
      ? this.orderService.getAllOrders() 
      : this.orderService.getOrdersByCustomer(user?.userId || '');

    fetch$.subscribe({
      next: (data) => {
        this.orders.set(data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load orders.');
        this.isLoading.set(false);
      }
    });
  }

  toggleSort(column: SortColumn): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedStatusFilter.set('ALL');
    this.currentPage.set(1);
  }

  getStatusLabel(status: OrderStatus | number | string): string {
    const numericStatus = Number(status);
    switch (numericStatus) {
      case OrderStatus.Pending: return 'Pending';
      case OrderStatus.StockReserved: return 'Stock Reserved';
      case OrderStatus.StockReservationFailed: return 'Stock Reservation Failed';
      case OrderStatus.Paid: return 'Paid';
      case OrderStatus.Cancelled: return 'Cancelled';
      case OrderStatus.Completed: return 'Completed';
      default: return String(status);
    }
  }

  getStatusBadgeClass(status: OrderStatus | number | string): string {
    const numericStatus = Number(status);
    switch (numericStatus) {
      case OrderStatus.Completed:
      case OrderStatus.Paid:
        return 'badge-active';
      case OrderStatus.Pending:
      case OrderStatus.StockReserved:
        return 'badge-customer';
      case OrderStatus.Cancelled:
      case OrderStatus.StockReservationFailed:
        return 'badge-inactive';
      default:
        return 'badge-customer';
    }
  }

  canCancel(status: OrderStatus | number | string): boolean {
    const numericStatus = Number(status);
    return numericStatus === OrderStatus.Pending || numericStatus === OrderStatus.StockReserved;
  }

  isFailedOrCancelled(status: OrderStatus | number | string): boolean {
    const numericStatus = Number(status);
    return numericStatus === OrderStatus.Cancelled || numericStatus === OrderStatus.StockReservationFailed;
  }

  getStepProgress(status: OrderStatus | number | string): number {
    const s = Number(status);
    switch (s) {
      case OrderStatus.Pending: return 1;
      case OrderStatus.StockReserved: return 2;
      case OrderStatus.Paid: return 3;
      case OrderStatus.Completed: return 4;
      default: return 0;
    }
  }

  getSkusSummary(order: Order): string {
    if (!order.items || order.items.length === 0) return 'N/A';
    const skus = order.items.map(i => i.sku).filter(Boolean);
    if (skus.length === 0) return 'N/A';
    if (skus.length === 1) return skus[0];
    return `${skus[0]} +${skus.length - 1} more`;
  }

  cancelOrder(order: Order): void {
    if (!confirm(`Are you sure you want to cancel Order #${order.id.slice(0, 8)}?`)) return;

    this.orderService.cancelOrder(order.id).subscribe({
      next: () => {
        this.toast.info(`Order #${order.id.slice(0, 8)} cancelled successfully.`);
        this.loadOrders();
        if (this.selectedOrder()?.id === order.id) {
          this.selectedOrder.set(null);
        }
      },
      error: () => {
        this.toast.error('Failed to cancel order.');
      }
    });
  }

  printInvoice(): void {
    window.print();
  }

  viewDetails(order: Order): void {
    this.selectedOrder.set(order);
  }

  closeDetails(): void {
    this.selectedOrder.set(null);
  }
}