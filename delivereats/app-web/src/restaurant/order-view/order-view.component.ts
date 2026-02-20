import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RestaurantService } from '../restaurant.service';
import { MenuItem } from '../intefaces/menu.interface';
import { SharedModule } from '../../shared/shared.module';
import { CartService } from '../../order/cart.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NavbarComponent } from '../../core/navbar/navbar.component';

@Component({
  selector: 'app-order-view',
  imports: [SharedModule, RouterLink, NavbarComponent],
  templateUrl: './order-view.component.html',
  styleUrl: './order-view.component.scss',
  standalone: true,
})
export class OrderViewComponent {
  private route = inject(ActivatedRoute);
  private restaurantService = inject(RestaurantService);
  menu = signal<MenuItem[]>([]);
  private cartService = inject(CartService);
  private snackBar = inject(MatSnackBar);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.restaurantService.getMenu(Number(id)).subscribe((res: any) => {
        this.menu.set(res.items);
      });
    }
  }

  addToCart(item: MenuItem) {
    this.cartService.addToCart(item);
    this.snackBar.open(`${item.name} agregado al carrito`, 'Cerrar', {
      duration: 2000,
      horizontalPosition: 'right',
    });
  }
}
