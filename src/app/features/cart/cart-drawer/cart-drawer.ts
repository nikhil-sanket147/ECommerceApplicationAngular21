import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { CartService } from '../cart.service';
import { RouteConfigLoadEnd, Router } from '@angular/router';
import { CartItem } from '../../../core/models/cart.model';

@Component({
  selector: 'app-cart-drawer',
  imports: [CommonModule],
  templateUrl: './cart-drawer.html',
  styleUrl: './cart-drawer.css',
})
export class CartDrawer implements OnInit {
  cartService = inject(CartService);
  private router = inject(Router);

  ngOnInit(): void {
    // this.cartService.getCart().subscribe({
    //   error:() => {}
    // });
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
    this.cartService.closeDrawer();
    this.router.navigate(['/checkout']);
  }
}
