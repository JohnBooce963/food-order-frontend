import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { shopLogin, shopToken } from './api';

@Component({
  selector: 'app-login',
  imports: [RouterLink],
  template: `
    <div class="login">
      <form class="card login-card" (submit)="submit($event)">
        <p class="login-icon" aria-hidden="true">🔒</p>
        <h1>เข้าสู่ระบบร้าน</h1>
        <p class="muted">สำหรับพนักงานร้าน เพื่อดูและจัดการออเดอร์</p>
        <label>
          รหัสผ่านร้าน
          <input
            type="password"
            autocomplete="current-password"
            [value]="password()"
            (input)="password.set($any($event.target).value)"
          />
        </label>
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
        <button class="btn primary big" [disabled]="!password() || busy()">
          {{ busy() ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ' }}
        </button>
        <a class="muted small" routerLink="/menu">← กลับไปหน้าสั่งอาหาร</a>
      </form>
    </div>
  `,
})
export class LoginPage {
  private router = inject(Router);
  password = signal('');
  error = signal('');
  busy = signal(false);

  constructor() {
    if (shopToken()) this.router.navigateByUrl('/orders');
  }

  async submit(e: Event) {
    e.preventDefault();
    this.busy.set(true);
    this.error.set('');
    try {
      await shopLogin(this.password());
      this.router.navigateByUrl('/orders');
    } catch (err) {
      this.error.set((err as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
}
