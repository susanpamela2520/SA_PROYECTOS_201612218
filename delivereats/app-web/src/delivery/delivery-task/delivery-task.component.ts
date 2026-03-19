import { Component, inject, signal } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { OrderService } from '../../order/order.service';
import { DeliveryService } from '../delivery.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-delivery-task',
  imports: [SharedModule, RouterLink],
  templateUrl: './delivery-task.component.html',
  styleUrl: './delivery-task.component.scss',
  standalone: true,
})
export class DeliveryTaskComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService); // Reusamos el de órdenes para ver qué hay
  private deliveryService = inject(DeliveryService);
  private snack = inject(MatSnackBar);

  availableOrders = signal<any[]>([]);
  restaurantId = signal<number>(0);

  ngOnInit() {
    this.restaurantId.set(Number(this.route.snapshot.paramMap.get('id')));
    this.loadOrders();
  }

  loadOrders() {
    // 1. Obtenemos TODAS las órdenes del restaurante
    this.orderService
      .getRestaurantOrders(this.restaurantId())
      .subscribe((res) => {
        // 2. Filtramos solo las que el repartidor puede tomar
        // Ajusta 'Preparando' según tu flujo real (puede ser 'Listo' o 'PENDIENTE')
        console.log('pedidos', res);
        const ready = (res as any[]).filter((o) => o.status === 'Enviado');
        this.availableOrders.set(ready);
      });
  }

  accept(orderId: number) {
    this.deliveryService.acceptOrder(orderId).subscribe({
      next: () => {
        this.snack.open('¡Pedido aceptado! Ve a "Mis Entregas"', 'OK', {
          duration: 3000,
        });
        this.router.navigate(['/deliveries']); // Lo mandamos a su dashboard
      },
      error: (e) =>
        this.snack.open('Error al aceptar: ' + e.error?.message, 'Cerrar'),
    });
  }
}
