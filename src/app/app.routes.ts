import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { shopToken } from './api';
import { LandingPage } from './landing';
import { LoginPage } from './login';
import { MenuPage } from './menu';
import { OrdersPage } from './orders';

export const routes: Routes = [
  { path: '', component: LandingPage, title: 'Mai Roo · ไม่รู้จะกินอะไร' },
  { path: 'menu', component: MenuPage, title: 'เมนู · Mai Roo' },
  { path: 'login', component: LoginPage, title: 'เข้าสู่ระบบร้าน · Mai Roo' },
  {
    path: 'orders',
    component: OrdersPage,
    title: 'ออเดอร์ร้าน · Mai Roo',
    canActivate: [() => (shopToken() ? true : inject(Router).parseUrl('/login'))],
  },
  { path: '**', redirectTo: '' },
];
