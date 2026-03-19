import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/orders';

  createOrder(orderData: any): Observable<any> {
    return this.http.post(this.apiUrl, orderData);
  }

  getRestaurantOrders(restaurantId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/restaurant/${restaurantId}`);
  }

  updateStatus(orderId: number, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${orderId}/status`, { status });
  }

  // Obtener órdenes de un local específico
  getOrdersByRestaurant(restaurantId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/restaurant/${restaurantId}`);
  }

  // Cambiar el estado (Ej: de PENDIENTE a PREPARANDO)
  updateOrderStatus(orderId: number, status: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${orderId}/status`, { status });
  }

  getUserOrders(): Observable<any[]> {
    // El Gateway ya sabe quién soy por el Interceptor (JWT)
    return this.http.get<any[]>(`${this.apiUrl}`);
  }

  cancelOrder(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/cancel`, {});
  }

  rateOrder(rateData: {
    id: number;
    rating: number;
    comment?: string;
    deliveryRating: number;
    deliveryComment?: string;
    items: { menuItemId: number; isRecommended: boolean }[];
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${rateData.id}/rate`, rateData);
  }
}
