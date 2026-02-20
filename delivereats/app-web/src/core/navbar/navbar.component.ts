import { Component, computed, inject, signal } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { CartService } from '../../order/cart.service';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'app-navbar',
  imports: [SharedModule, MatMenuModule, MatToolbarModule, MatBadgeModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  standalone: true,
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  public cartService = inject(CartService);

  // Signal para almacenar los datos del usuario logueado
  user = signal<any>(null);
  userRole = computed(() => this.user()?.role?.toUpperCase() || '');

  ngOnInit(): void {
    // Obtenemos los datos del token al iniciar
    const data = this.authService.getUserData();
    this.user.set(data);
  }

  logout(): void {
    this.user.set('');
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToHome(): void {
    // Simplemente navegamos a la ruta raíz del dashboard
    this.router.navigate(['/dashboard']);
  }

  checkout(): void {
    console.log('Procesando pedido:', this.cartService.items());
    this.router.navigate(['/checkout']);
  }
}
