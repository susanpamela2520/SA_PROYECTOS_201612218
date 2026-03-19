import { Component, inject, signal } from '@angular/core';
import { CartService } from '../cart.service';
import { SharedModule } from '../../shared/shared.module';
import { Router, RouterLink } from '@angular/router';
import { OrderService } from '../order.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PaymentService } from '../../payment/payment.service';

@Component({
  selector: 'app-cart',
  imports: [SharedModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
  standalone: true,
})
export class CartComponent {
  public cartService = inject(CartService);
  private orderService = inject(OrderService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private paymentService = inject(PaymentService);
  public selectedCurrency = signal<string>('GTQ');
  public convertedTotal = signal<number | null>(null);
  public isConverting = signal<boolean>(false);
  confirmOrder() {
    // 1. Validamos que haya items
    const items = this.cartService.items();
    if (items.length === 0) return;
    console.log(items);

    // 2. Estructuramos la data para el microservicio de Órdenes
    const orderPayload = {
      restaurantId: items[0].restaurantId,
      restaurantName: items[0].restaurantName,
      total: this.cartService.totalPrice(),
      items: items.map((i) => ({
        menuItemId: i.id,
        quantity: i.quantity,
        price: i.price,
      })),
    };

    // GOLPE 1: Crear la orden
    this.orderService.createOrder(orderPayload).subscribe({
      next: (order: any) => {
        // La orden ya existe en la BD pero está "PENDIENTE"
        const orderId = order.id;
        const totalAPagar = order.total; // Asegúrate de que tu backend devuelva el total aquí

        // GOLPE 2: Cobrar de la Billetera Digital
        this.paymentService.payOrder(orderId, totalAPagar).subscribe({
          next: (payRes: any) => {
            if (payRes.success) {
              // ¡SÍ HAY FONDOS!  (El backend ya cambió el estado a PAGADO)
              this.snackBar.open(
                '¡Pago exitoso! Tu orden ha sido confirmada',
                'Cerrar',
                { duration: 4000 },
              );
              this.cartService.clearCart();
              this.router.navigate(['/my-orders']);
            } else {
              // ¡NO HAY FONDOS!
              this.snackBar.open(
                ` Error: ${payRes.message} (Faltan Q${totalAPagar})`,
                'Entendido',
                { duration: 6000 },
              );
              this.router.navigate(['/wallet']);
            }
          },
          error: () =>
            this.snackBar.open(
              'Hubo un problema al procesar el pago.',
              'Cerrar',
              {
                duration: 3000,
              },
            ),
        });
      },
      error: () =>
        this.snackBar.open('Error al intentar crear la orden.', 'Cerrar', {
          duration: 3000,
        }),
    });
  }

  onCurrencyChange(event: any) {
    const targetCurrency = event.value;
    this.selectedCurrency.set(targetCurrency);

    // Si regresa a Quetzales, limpiamos la conversión visual
    if (targetCurrency === 'GTQ') {
      this.convertedTotal.set(null);
      return;
    }

    const currentTotal = this.cartService.totalPrice();
    if (currentTotal <= 0) return;

    this.isConverting.set(true);

    // Llamamos al Gateway para la conversión visual
    this.paymentService
      .convertCurrency(currentTotal, targetCurrency)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.convertedTotal.set(res.convertedAmount);
          }
          this.isConverting.set(false);
        },
        error: () => {
          this.snackBar.open(
            'No se pudo obtener la tasa de cambio actual',
            'Cerrar',
            { duration: 3000 },
          );
          this.selectedCurrency.set('GTQ'); // Revertimos a GTQ por seguridad
          this.convertedTotal.set(null);
          this.isConverting.set(false);
        },
      });
  }
}
