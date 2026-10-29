import { Routes } from '@angular/router';
import { MenuPage } from './menu';
import { OrdersPage } from './orders';

export const routes: Routes = [
  { path: '', component: MenuPage, title: 'เมนู · Mai Roo' },
  { path: 'orders', component: OrdersPage, title: 'ออเดอร์ · Mai Roo' },
  { path: '**', redirectTo: '' },
];
