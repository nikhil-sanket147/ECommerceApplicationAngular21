import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { CartService } from '../cart.service';
import { RouteConfigLoadEnd, Router } from '@angular/router';
import { CartItem } from '../../../core/models/cart.model';
import { OrderService } from '../../orders/order.service';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-cart-drawer',
  imports: [CommonModule],
  templateUrl: './cart-drawer.html',
  styleUrl: './cart-drawer.css',
})
export class CartDrawer implements OnInit {
  cartService = inject(CartService);
  private router = inject(Router);

  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  ngOnInit(): void {
    this.cartService.getCart().subscribe({
      error: () => { }
    });
  }

  increaseQty(item: CartItem): void {
    this.cartService.updateItemQuantity({
      productId: item.productId,
      quantity: item.quantity + 1
    }).subscribe();
  }

  decreaseQty(item: CartItem): void {
    if (item.quantity > 1) {
      this.cartService.updateItemQuantity({
        productId: item.productId,
        quantity: item.quantity - 1
      }).subscribe();
    } else {
      this.removeItem(item);
    }
  }

  removeItem(item: CartItem): void {
    this.cartService.removeItem(item.productId).subscribe();
  }

  clearAll(): void {
    if (confirm('Are you sure you want to clear your cart?')) {
      this.cartService.clearCart().subscribe();
    }
  }

  goToCheckout(): void {
    const user = this.authService.currentUser();
    const items = this.cartService.cartItems();

    if (!user?.userId) {
      this.toast.warning('Please log in to complete your checkout.', 'Authentication Required');
      return;
    }

    if (items.length === 0) return;

    const orderPayload = {
      customerId: user.userId,
      items: items.map(i => ({
        productId: String(i.productId),
        sku: (i as any).sku || 'DEFAULT-SKU',
        unitPrice: i.unitPrice,
        quantity: i.quantity
      }))
    };

    this.orderService.createOrder(orderPayload).subscribe({
      next: () => {
        this.cartService.clearCart().subscribe();
        this.cartService.closeDrawer();
        this.router.navigate(['/orders']);
      },
      error: (err) => {
        this.toast.error('Failed to create your order. Please try again.');
      }
    });
  }
}
