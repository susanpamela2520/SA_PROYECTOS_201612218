import { Routes } from '@angular/router';
import { AuthComponent } from '../auth/auth/auth.component';
import { MenuComponent } from '../restaurant/menu/menu.component';
import { OrderViewComponent } from '../restaurant/order-view/order-view.component';

export const routes: Routes = [
  {
    path: 'login',
    component: AuthComponent,
  },
  {
    path: 'createAccount',
    loadComponent: () =>
      import('../auth/create-account/create-account.component').then(
        (m) => m.CreateAccountComponent,
      ),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('../dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
  },
  { path: 'restaurant/:id/manage-menu', component: MenuComponent },
  { path: 'order/:id', component: OrderViewComponent },
  { path: '**', redirectTo: 'login' },
];
