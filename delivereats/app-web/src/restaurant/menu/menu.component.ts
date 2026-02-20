import { Component, inject, signal } from '@angular/core';
import { RestaurantService } from '../restaurant.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MenuItem } from '../intefaces/menu.interface';
import { MenuFormComponent } from '../menu-form/menu-form.component';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-menu',
  imports: [SharedModule, RouterLink],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
  standalone: true,
})
export class MenuComponent {
  private restaurantService = inject(RestaurantService);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  restaurantId = signal<number>(0);
  dishes = signal<MenuItem[]>([]);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.restaurantId.set(Number(id));
      this.loadMenu();
    }
  }

  loadMenu() {
    this.restaurantService.getMenu(this.restaurantId()).subscribe({
      next: (res: any) => this.dishes.set(res.menuItems || res.items || []),
      error: () => this.showMsg('Error al cargar el menú'),
    });
  }

  openForm(item: MenuItem | null = null) {
    const dialogRef = this.dialog.open(MenuFormComponent, {
      width: '400px',
      data: { item },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (item?.id) {
          this.restaurantService.updateDish(item.id, result).subscribe(() => {
            this.showMsg('Plato actualizado');
            this.loadMenu();
          });
        } else {
          this.restaurantService
            .createDish(this.restaurantId(), result)
            .subscribe(() => {
              this.showMsg('Plato creado');
              this.loadMenu();
            });
        }
      }
    });
  }

  deleteDish(id: number) {
    if (confirm('¿Borrar este plato?')) {
      this.restaurantService.deleteDish(id).subscribe(() => {
        this.showMsg('Plato eliminado');
        this.loadMenu();
      });
    }
  }

  private showMsg(m: string) {
    this.snack.open(m, 'OK', { duration: 3000 });
  }
}
