import { Component, inject, signal } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { OrderService } from '../order.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-order-management',
  imports: [SharedModule, RouterLink],
  templateUrl: './order-management.component.html',
  styleUrl: './order-management.component.scss',
  standalone: true,
})
export class OrderManagementComponent {
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);

  orders = signal<any[]>([]);
  loading = signal(false);
  restaurantId = signal<number | null>(null);

  ngOnInit() {
    const idFromRoute = this.route.snapshot.paramMap.get('id');

    if (idFromRoute) {
      this.restaurantId.set(Number(idFromRoute));
      this.loadOrders(Number(idFromRoute));
    }
  }

  loadOrders(resId: number) {
    this.loading.set(true);

    this.orderService.getOrdersByRestaurant(resId).subscribe({
      next: (data) => {
        this.orders.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  changeStatus(orderId: number, newStatus: string) {
    this.orderService.updateOrderStatus(orderId, newStatus).subscribe({
      next: () => {
        this.snackBar.open(`Orden #${orderId} actualizada`, 'OK', {
          duration: 2000,
        });
        // Recargamos para ver el cambio reflejado desde la DB
        if (this.restaurantId()) {
          this.loadOrders(this.restaurantId()!);
        }
      },
    });
  }
  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  cancel(id: number) {
    if (confirm('¿Rechazar esta orden? El cliente será notificado.')) {
      this.orderService.cancelOrder(id).subscribe({
        next: () => {
          this.snackBar.open('Orden rechazada/cancelada', 'OK', {
            duration: 3000,
          });

          // Como ya tenemos el restaurantId guardado en el signal, recargamos
          const currentId = this.restaurantId();
          if (currentId) {
            this.loadOrders(currentId);
          }
        },
        error: (err) => {
          this.snackBar.open('Error al procesar la cancelación', 'Cerrar');
        },
      });
    }
  }

  get role() {
    return this.authService.userRole();
  }
}
