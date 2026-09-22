import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cart, CartItem, AddCartItemRequest, UpdateCartItemRequest } from '../../core/models/cart.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/Cart`;

  // Reactive State
  cart = signal<Cart | null>(null);
  isLoading = signal<boolean>(false);
  isDrawerOpen = signal<boolean>(false);

  // Computed signals for UI bindings
  cartItems = computed(() => this.cart()?.items || []);
  
  cartCount = computed(() => 
    this.cartItems().reduce((acc, item) => acc + item.quantity, 0)
  );

  cartSubtotal = computed(() => 
    this.cartItems().reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0)
  );

  // Drawer Controls
  openDrawer(): void {
    this.isDrawerOpen.set(true);
  }

  closeDrawer(): void {
    this.isDrawerOpen.set(false);
  }

  toggleDrawer(): void {
    this.isDrawerOpen.update((open) => !open);
  }

  // API Methods
  getCart(): Observable<Cart> {
    this.isLoading.set(true);
    return this.http.get<Cart>(`${this.baseUrl}/get-cart`).pipe(
      tap({
        next: (data) => {
          this.cart.set(data);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      })
    );
  }

  addItem(req: AddCartItemRequest): Observable<Cart> {
    this.isLoading.set(true);
    return this.http.post<Cart>(`${this.baseUrl}/add-cart-items`, req).pipe(
      tap({
        next: (updatedCart) => {
          this.cart.set(updatedCart);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      })
    );
  }

  updateItemQuantity(req: UpdateCartItemRequest): Observable<Cart> {
    this.isLoading.set(true);
    return this.http.put<Cart>(`${this.baseUrl}/update-cart-items`, req).pipe(
      tap({
        next: (updatedCart) => {
          this.cart.set(updatedCart);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      })
    );
  }

  removeItem(productId: string | number): Observable<any> {
    this.isLoading.set(true);
    return this.http.delete(`${this.baseUrl}/remove-item/${productId}`).pipe(
      tap({
        next: () => {
          this.cart.update((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              items: prev.items.filter((i) => String(i.productId) !== String(productId))
            };
          });
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      })
    );
  }

  clearCart(): Observable<any> {
    this.isLoading.set(true);
    return this.http.delete(`${this.baseUrl}/clear-cart`).pipe(
      tap({
        next: () => {
          this.cart.update((prev) => prev ? { ...prev, items: [] } : null);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      })
    );
  }
}