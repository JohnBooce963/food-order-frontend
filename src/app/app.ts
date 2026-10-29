import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  template: `
    <header class="top">
      <b>Mai Roo</b>
      <nav>
        <a routerLink="/" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: true }">เมนู</a>
        <a routerLink="/orders" routerLinkActive="on">ออเดอร์ (ร้าน)</a>
      </nav>
    </header>
    <main><router-outlet /></main>
  `,
})
export class App {}
