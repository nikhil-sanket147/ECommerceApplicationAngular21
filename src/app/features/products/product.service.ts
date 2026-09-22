import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category, Product, CreateProductRequest } from '../../core/models/product.model';

export interface CreateCategoryRequest{
  name: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})

export class ProductService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;

  // --- Category Endpoints ---
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/Category/get-all`);
  }

  createCategory(dto: CreateCategoryRequest): Observable<Category> {
    return this.http.post<Category>(`${this.baseUrl}/Category`, dto);
  }

  updateCategory(id: string | number, dto: CreateCategoryRequest): Observable<Category>{
    return this.http.put<Category>(`${this.baseUrl}/Category/${id}`, dto);
  }

  deleteCategory(id: string | number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/Category/${id}`, { responseType: 'text' });
  }

  // --- Product Endpoints ---
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/Product`);
  }

  getProductById(id: string | number): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/Product/${id}`);
  }

  getProductsByCategory(categoryId: string | number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/Product/category/${categoryId}`);
  }

  createProduct(dto: CreateProductRequest): Observable<Product> {
    return this.http.post<Product>(`${this.baseUrl}/Product`, dto);
  }

  updateProduct(id: string | number, dto: Partial<CreateProductRequest>): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/Product/${id}`, dto);
  }

  deleteProduct(id: string | number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/Product/${id}`, { responseType: 'text' });
  }

updateStock(id: string | number, quantityChange: number): Observable<any> {
  return this.http.patch(`${this.baseUrl}/Product/${id}/stock?quantityChange=${quantityChange}`, null);
}
}

