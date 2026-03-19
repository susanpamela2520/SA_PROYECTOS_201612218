import { Component, inject, OnInit, signal } from '@angular/core';
import { DeliveryService } from '../delivery.service';
import { SharedModule } from '../../shared/shared.module';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-driver-profile',
  imports: [SharedModule, RouterLink],
  templateUrl: './driver-profile.component.html',
  styleUrl: './driver-profile.component.scss',
  standalone: true,
})
export class DriverProfileComponent implements OnInit {
  private deliveryService = inject(DeliveryService);

  averageRating = signal<number>(0);
  totalReviews = signal<number>(0);
  ratedDeliveries = signal<any[]>([]); // Solo guardaremos los viajes que fueron calificados

  ngOnInit() {
    this.deliveryService.getMyDeliveries().subscribe({
      next: (deliveries) => {
        // 1. Filtramos: Solo queremos los viajes donde el cliente dejó estrellas
        console.log('dev ', deliveries);
        const rated = deliveries.filter((d: any) => d.rating && d.rating > 0);

        // 2. Ordenamos del más reciente al más antiguo
        rated.sort(
          (a, b) =>
            new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
        );

        this.ratedDeliveries.set(rated);

        // 3. Calculamos la matemática del promedio general
        if (rated.length > 0) {
          this.totalReviews.set(rated.length);
          const sum = rated.reduce(
            (acc: number, curr: any) => acc + curr.rating,
            0,
          );
          this.averageRating.set(sum / rated.length);
        }
      },
      error: (err) =>
        console.error('Error cargando historial de calificaciones', err),
    });
  }
}
