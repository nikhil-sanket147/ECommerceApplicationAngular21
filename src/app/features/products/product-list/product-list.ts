import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-list',
  imports: [],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Mock product data for initial UI check
  products = signal<Product[]>([
    { id: 1, name: 'Wireless Headphones', price: 99.99, description: 'Noise cancelling over-ear headphones' },
    { id: 2, name: 'Mechanical Keyboard', price: 129.50, description: 'RGB hot-swappable gaming keyboard' },
    { id: 3, name: 'Ergonomic Mouse', price: 59.00, description: 'Precision wireless ergonomic mouse' }
  ]);

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
