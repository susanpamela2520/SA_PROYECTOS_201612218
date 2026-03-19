import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/payment'; // La ruta de tu API Gateway
  private fxUrl = 'http://localhost:3000/fx';

  getWallet(): Observable<any> {
    return this.http.get(`${this.apiUrl}/wallet`);
  }

  recharge(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/recharge`, data);
  }

  payOrder(orderId: number, amount: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/pay`, { orderId, amount });
  }

  convertCurrency(amount: number, target: string): Observable<any> {
    return this.http.get(
      `${this.fxUrl}/convert?amount=${amount}&target=${target}`,
    );
  }
}
