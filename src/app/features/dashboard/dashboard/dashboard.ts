import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { OrderService } from '../../orders/order.service';
import { ProductService } from '../../products/product.service';
import { AuthService } from '../../auth/auth.service';
import { Order, OrderStatus } from '../../../core/models/order.model';
import { Product } from '../../../core/models/product.model';
import { AdminService, AdminUserItem } from '../../admin/admin.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private orderService = inject(OrderService);
  private productService = inject(ProductService);
  private userService = inject(AdminService);
  authService = inject(AuthService);

  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  orders = signal<Order[]>([]);
  products = signal<Product[]>([]);
  users = signal<AdminUserItem[]>([]);

  // Computed Metrics
  totalRevenue = computed(() => {
    return this.orders()
      .filter(o => 
        Number(o.status) === OrderStatus.Paid || 
        Number(o.status) === OrderStatus.Completed ||
        o.status === 'Paid' ||
        o.status === 'Completed'
      )
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  });

  completedOrdersCount = computed(() => {
    return this.orders().filter(o => 
      Number(o.status) === OrderStatus.Completed || o.status === 'Completed'
    ).length;
  });

  lowStockProducts = computed(() => {
    return this.products().filter(p => (p.stockQuantity ?? 0) <= 5);
  });

  recentOrders = computed(() => {
    return this.orders().slice(0, 5);
  });

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      orders: this.orderService.getAllOrders(),
      products: this.productService.getProducts(),
      users: this.userService.getAllUsers()
    }).subscribe({
      next: (res) => {
        this.orders.set(res.orders || []);
        this.products.set(res.products || []);
        this.users.set(res.users || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load dashboard data:', err);
        this.errorMessage.set('Could not load all dashboard metrics. Please verify microservices are online.');
        this.isLoading.set(false);
      }
    });
  }

  getStatusLabel(status: OrderStatus | number | string): string {
    const s = Number(status);
    switch (s) {
      case OrderStatus.Pending: return 'Pending';
      case OrderStatus.StockReserved: return 'Stock Reserved';
      case OrderStatus.StockReservationFailed: return 'Stock Failed';
      case OrderStatus.Paid: return 'Paid';
      case OrderStatus.Cancelled: return 'Cancelled';
      case OrderStatus.Completed: return 'Completed';
      default: return String(status);
    }
  }

  getStatusBadgeClass(status: OrderStatus | number | string): string {
    const s = Number(status);
    switch (s) {
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
}