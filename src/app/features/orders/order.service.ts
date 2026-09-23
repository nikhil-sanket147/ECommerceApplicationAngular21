import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Order, CreateOrderRequest } from '../../core/models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/Orders`;

  createOrder(dto: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/create-order`, dto);
  }

  getOrdersByCustomer(customerId: string): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}/get-orders-by-customer/${customerId}`);
  }

  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}/get-all-orders`);
  }

  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/get-order/${id}`);
  }

  cancelOrder(id: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/cancel-order/${id}`, {});
  }
}