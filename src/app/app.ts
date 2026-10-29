import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { shopToken } from './api';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  template: `
    <header class="top">
      <a class="brand" routerLink="/"><span aria-hidden="true">🍜</span> Mai Roo</a>
      <nav>
        <a routerLink="/" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: true }">หน้าแรก</a>
        <a routerLink="/menu" routerLinkActive="on">เมนู</a>
        @if (shopToken()) {
          <a routerLink="/orders" routerLinkActive="on">ออเดอร์ร้าน</a>
        } @else {
          <a routerLink="/login" routerLinkActive="on">สำหรับร้าน</a>
        }
      </nav>
    </header>
    <main><router-outlet /></main>
    <footer class="foot">Mai Roo · สั่งอาหารออนไลน์</footer>
  `,
})
export class App {
  protected readonly shopToken = shopToken;
}
