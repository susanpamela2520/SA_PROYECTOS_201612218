import { Component, inject, signal } from '@angular/core';
import { DeliveryService } from '../delivery.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SharedModule } from '../../shared/shared.module';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../order/order.service';

@Component({
  selector: 'app-my-deliveries',
  imports: [SharedModule, RouterLink],
  templateUrl: './my-deliveries.component.html',
  styleUrl: './my-deliveries.component.scss',
  standalone: true,
})
export class MyDeliveriesComponent {
  private deliveryService = inject(DeliveryService);
  private orderService = inject(OrderService);
  private snack = inject(MatSnackBar);
  deliveries = signal<any[]>([]);
  uploading = signal(false);
  zoomedImage = signal<string | null>(null);

  ngOnInit() {
    this.loadMyDeliveries();
  }

  loadMyDeliveries() {
    this.deliveryService.getMyDeliveries().subscribe((data) => {
      this.deliveries.set(data);
    });
  }
  onFileSelected(event: any, deliveryId: number) {
    const file = event.target.files[0];

    if (file) {
      this.uploading.set(true);

      // 1. Leemos el archivo
      const reader = new FileReader();

      reader.onload = () => {
        // 2. Obtenemos el Base64 (ej: "data:image/png;base64,iVBORw0KGgo...")
        const base64Image = reader.result as string;

        // 3. Enviamos al backend
        this.finalizeDelivery(deliveryId, base64Image);
      };

      reader.onerror = (error) => {
        console.error('Error leyendo archivo:', error);
        this.uploading.set(false);
      };

      reader.readAsDataURL(file); // Inicia la lectura
    }
  }

  finalizeDelivery(deliveryId: number, proofImage: string) {
    this.deliveryService
      .updateStatus(deliveryId, 'Entregado', proofImage)
      .subscribe({
        next: () => {
          this.snack.open('¡Foto subida y entrega finalizada! 📸🚀', 'Genial', {
            duration: 3000,
          });
          this.uploading.set(false);
          this.loadMyDeliveries(); // Recargar lista
        },
        error: (err) => {
          console.error(err);
          this.snack.open(
            'Error al subir la prueba. Intenta una imagen más ligera.',
            'Cerrar',
          );
          this.uploading.set(false);
        },
      });
  }

  cancelDelivery(orderId: number) {
    if (
      confirm(
        '¿Estás seguro de cancelar esta orden? Se le devolverá el dinero al cliente automáticamente.',
      )
    ) {
      this.orderService.cancelOrder(orderId).subscribe({
        next: () => {
          this.snack.open(
            'Orden cancelada y reembolso procesado 💸',
            'Cerrar',
            { duration: 4000 },
          );
          this.loadMyDeliveries(); // Recargamos para actualizar la vista
        },
        error: (err) => {
          console.error(err);
          this.snack.open(
            'Error al cancelar: ' +
              (err.error?.message || 'Intenta nuevamente'),
            'Entendido',
          );
        },
      });
    }
  }

  openImageZoom(url: string) {
    this.zoomedImage.set(url);
  }

  // 3. Método para cerrar el zoom
  closeZoom() {
    this.zoomedImage.set(null);
  }

  getStatusClass(status: string) {
    return `status-${status.toLowerCase()}`;
  }
}
