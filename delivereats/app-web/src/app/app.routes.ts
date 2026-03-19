import { Routes } from '@angular/router';
import { AuthComponent } from '../auth/auth/auth.component';
import { MenuComponent } from '../restaurant/menu/menu.component';
import { OrderViewComponent } from '../restaurant/order-view/order-view.component';
import { CartComponent } from '../order/cart/cart.component';
import { MyOrdersComponent } from '../order/my-orders/my-orders.component';
import { DeliveryTaskComponent } from '../delivery/delivery-task/delivery-task.component';
import { MyDeliveriesComponent } from '../delivery/my-deliveries/my-deliveries.component';
import { DriverProfileComponent } from '../delivery/driver-profile/driver-profile.component';
import { WalletComponent } from '../payment/wallet/wallet.component';

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
  { path: 'cart', component: CartComponent },
  {
    path: 'manage-orders/:id',
    loadComponent: () =>
      import('../order/order-management/order-management.component').then(
        (m) => m.OrderManagementComponent,
      ),
  },
  { path: 'my-orders', component: MyOrdersComponent },
  {
    path: 'delivery-tasks/:id',
    component: DeliveryTaskComponent,
  },
  {
    path: 'deliveries',
    component: MyDeliveriesComponent,
  },
  { path: 'driver-profile', component: DriverProfileComponent },
  { path: 'wallet', component: WalletComponent },
  { path: '**', redirectTo: 'login' },
];
