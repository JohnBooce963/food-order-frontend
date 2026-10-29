import { Component, OnDestroy, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { api, Order } from './api';

@Component({
  selector: 'app-orders',
  imports: [DatePipe],
  template: `
    <div class="bar">
      <h2>ออเดอร์ล่าสุด</h2>
      <button (click)="load()">รีเฟรช</button>
    </div>
    @if (error()) {
      <p class="error">{{ error() }}</p>
    }
    <div class="grid">
      @for (o of orders(); track o.id) {
        <article class="card order" [class.done]="o.done">
          <header>
            <b>#{{ o.id }} {{ o.customerName }}</b>
            <span class="muted">{{ o.createdAt | date: 'd MMM HH:mm' }}</span>
          </header>
          <ul>
            @for (i of o.items; track i.id) {
              <li>
                <span>{{ i.qty }} × {{ i.foodName }}@if (i.sizeName) { ({{ i.sizeName }})}</span>
                <span>฿{{ i.unitPrice * i.qty }}</span>
              </li>
            }
          </ul>
          <footer>
            <b>รวม ฿{{ o.total }}</b>
            @if (o.done) {
              <span class="ok">เสร็จแล้ว</span>
            } @else {
              <button class="primary" (click)="done(o)">ทำเสร็จแล้ว</button>
            }
          </footer>
        </article>
      } @empty {
        <p class="muted">ยังไม่มีออเดอร์</p>
      }
    </div>
  `,
})
export class OrdersPage implements OnDestroy {
  orders = signal<Order[]>([]);
  error = signal('');
  // The shop keeps this screen open, so check for new orders every 10 s.
  private timer = setInterval(() => this.load(), 10_000);

  constructor() {
    this.load();
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  async load() {
    try {
      this.orders.set(await api<Order[]>('/orders'));
      this.error.set('');
    } catch (e) {
      this.error.set((e as Error).message);
    }
  }

  async done(o: Order) {
    try {
      const updated = await api<Order>(`/orders/${o.id}/done`, {});
      this.orders.update((list) => list.map((x) => (x.id === updated.id ? updated : x)));
    } catch (e) {
      this.error.set((e as Error).message);
    }
  }
}
