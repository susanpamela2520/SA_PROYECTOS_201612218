import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DeliveryService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/delivery'; // Tu Gateway

  // 1. Aceptar un pedido (OrderService -> PENDING/PREPARING -> EN_CAMINO)
  acceptOrder(orderId: number): Observable<any> {
    // El backend extrae el driverId del Token, no hace falta enviarlo
    console.log('aceptado ', orderId);
    return this.http.patch(`${this.apiUrl}/accept/${orderId}`, {});
  }

  // 2. Actualizar estado (EN_CAMINO -> ENTREGADO)
  updateStatus(
    deliveryId: number,
    status: string,
    proofUrl?: string,
  ): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${deliveryId}/status`, {
      status,
      proofOfDelivery: proofUrl,
    });
  }

  // 3. Ver mis entregas (Historial)
  getMyDeliveries(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my-history`);
  }
}
