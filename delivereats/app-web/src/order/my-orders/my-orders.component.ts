import { Component, inject, signal } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { OrderService } from '../order.service';
import { RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-my-orders',
  imports: [SharedModule, RouterLink],
  templateUrl: './my-orders.component.html',
  styleUrl: './my-orders.component.scss',
  standalone: true,
})
export class MyOrdersComponent {
  private orderService = inject(OrderService);
  orders = signal<any[]>([]);
  private snack = inject(MatSnackBar);
  currentRatings: { [orderId: number]: number } = {};
  deliveryRatings: { [orderId: number]: number } = {};
  itemRatings: { [orderId: number]: { [menuItemId: number]: boolean } } = {};

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.orderService.getUserOrders().subscribe({
      next: (data: any) => {
        console.log(data.orders);
        this.orders.set(data.orders);
      },
      error: (err) => console.error('Error al traer tus pedidos', err),
    });
  }

  getStatusClass(status: string) {
    return `status-${status.toLowerCase()}`;
  }

  cancel(id: number) {
    // Es buena práctica pedir confirmación rápida
    if (confirm('¿Estás seguro de que deseas cancelar tu pedido?')) {
      this.orderService.cancelOrder(id).subscribe({
        next: () => {
          this.snack.open('Pedido cancelado correctamente', 'Cerrar', {
            duration: 3000,
          });
          this.reload();
        },
        error: (err) => {
          this.snack.open(
            'No se pudo cancelar el pedido: ' + err.error.message,
            'Entendido',
          );
        },
      });
    }
  }

  setRating(orderId: number, rating: number) {
    this.currentRatings[orderId] = rating;
  }

  submitRating(order: any, restaurantComment: string, deliveryComment: string) {
    const rating = this.currentRatings[order.id];
    const deliveryRating = this.deliveryRatings[order.id];

    // Validación básica: Exigimos que califique al menos restaurante y motorista
    if (!rating || !deliveryRating) {
      this.snack.open(
        'Por favor califica al restaurante y al repartidor con estrellas.',
        'Entendido',
        { duration: 3000 },
      );
      return;
    }

    // Formateamos los platillos calificados a un array para enviarlos al backend
    const items = [];
    if (this.itemRatings[order.id]) {
      for (const [menuItemId, isRecommended] of Object.entries(
        this.itemRatings[order.id],
      )) {
        items.push({ menuItemId: Number(menuItemId), isRecommended });
      }
    }

    // Armamos el "Mega Paquete" Fase 2
    const rateData = {
      id: order.id,
      rating: rating,
      comment: restaurantComment,
      deliveryRating: deliveryRating,
      deliveryComment: deliveryComment,
      items: items,
    };

    this.orderService.rateOrder(rateData).subscribe({
      next: () => {
        this.snack.open(
          '¡Gracias! Tus calificaciones fueron enviadas.',
          'Cerrar',
          { duration: 3000 },
        );
        this.reload(); // Recargamos para que aparezca la vista de "Ya calificado"
      },
      error: (err) => {
        console.error('Error al calificar', err);
        this.snack.open('Hubo un error al guardar tu calificación', 'Cerrar', {
          duration: 3000,
        });
      },
    });
  }

  setDeliveryRating(orderId: number, rating: number) {
    this.deliveryRatings[orderId] = rating;
  }

  setItemRating(orderId: number, itemId: number, isRecommended: boolean) {
    if (!this.itemRatings[orderId]) {
      this.itemRatings[orderId] = {};
    }
    this.itemRatings[orderId][itemId] = isRecommended;
  }
}
