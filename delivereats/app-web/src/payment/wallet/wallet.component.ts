import { Component, inject, signal } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { PaymentService } from '../payment.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-wallet',
  imports: [SharedModule, FormsModule, RouterLink],
  templateUrl: './wallet.component.html',
  styleUrl: './wallet.component.scss',
  standalone: true,
})
export class WalletComponent {
  private paymentService = inject(PaymentService);
  private snack = inject(MatSnackBar);

  balance = signal<number>(0);

  // Objeto para atrapar los datos del formulario al vuelo
  rechargeData = {
    amount: null,
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  };

  ngOnInit() {
    this.loadWallet();
  }

  loadWallet() {
    this.paymentService.getWallet().subscribe({
      next: (res: any) => this.balance.set(res.balance),
      error: () =>
        this.snack.open('Error al cargar la billetera', 'Cerrar', {
          duration: 3000,
        }),
    });
  }

  recharge() {
    // Validación rápida
    if (!this.rechargeData.amount || !this.rechargeData.cardNumber) {
      this.snack.open(
        'Llena los datos de la tarjeta y el monto a recargar.',
        'Entendido',
      );
      return;
    }

    this.paymentService.recharge(this.rechargeData).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.balance.set(res.newBalance); // Actualizamos el saldo en pantalla
          this.snack.open(
            `¡Recarga exitosa de Q${this.rechargeData.amount}! 💸`,
            'Cerrar',
            { duration: 4000 },
          );

          // Limpiamos el formulario
          this.rechargeData = {
            amount: null,
            cardNumber: '',
            expiryDate: '',
            cvv: '',
          };
        } else {
          // Si termina en 0000 y el banco la rechaza
          this.snack.open(` ${res.message}`, 'Entendido');
        }
      },
      error: () =>
        this.snack.open(
          'Error al procesar la recarga con el banco.',
          'Cerrar',
          { duration: 3000 },
        ),
    });
  }
}
