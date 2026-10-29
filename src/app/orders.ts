import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { api, ApiError, Order, shopLogout } from './api';

@Component({
  selector: 'app-orders',
  imports: [DatePipe],
  template: `
    <header class="page-head">
      <div>
        <h1>ออเดอร์ร้าน</h1>
        <p class="muted small">
          อัปเดตเองทุก 10 วินาที@if (updatedAt()) { · ล่าสุด {{ updatedAt() | date: 'HH:mm:ss' }}}
        </p>
      </div>
      <div class="actions">
        <button class="btn" (click)="load()">รีเฟรช</button>
        <button class="btn" (click)="logout()">ออกจากระบบ</button>
      </div>
    </header>

    <div class="stats">
      <div class="card stat"><span>รอทำ</span><b>{{ open().length }}</b></div>
      <div class="card stat"><span>ออเดอร์วันนี้</span><b>{{ today().length }}</b></div>
      <div class="card stat"><span>ยอดขายวันนี้</span><b>฿{{ todayTotal() }}</b></div>
    </div>

    <nav class="chips">
      <button class="chip" [class.on]="tab() === 'open'" (click)="tab.set('open')">รอทำ ({{ open().length }})</button>
      <button class="chip" [class.on]="tab() === 'done'" (click)="tab.set('done')">เสร็จแล้ว ({{ done().length }})</button>
    </nav>

    @if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
    }

    <div class="grid orders">
      @for (o of shown(); track o.id) {
        <article class="card order" [class.done]="o.done">
          <header>
            <span class="order-no">#{{ o.id }}</span>
            <span class="muted small" [title]="o.createdAt | date: 'd MMM y HH:mm'">{{ ago(o.createdAt) }}</span>
          </header>
          <p class="customer">{{ o.customerName }}</p>
          <ul class="lines">
            @for (i of o.items; track i.id) {
              <li>
                <span><b>{{ i.qty }}×</b> {{ i.foodName }}@if (i.sizeName) { <span class="muted">({{ i.sizeName }})</span>}</span>
                <span>฿{{ i.unitPrice * i.qty }}</span>
              </li>
            }
          </ul>
          <footer>
            <b>รวม ฿{{ o.total }}</b>
            @if (o.done) {
              <span class="pill">เสร็จแล้ว</span>
            } @else {
              <button class="btn primary" [disabled]="busyId() === o.id" (click)="markDone(o)">ทำเสร็จแล้ว ✓</button>
            }
          </footer>
        </article>
      } @empty {
        <p class="empty">{{ tab() === 'open' ? 'ไม่มีออเดอร์ที่รอทำ 🎉' : 'ยังไม่มีออเดอร์ที่เสร็จ' }}</p>
      }
    </div>
  `,
})
export class OrdersPage implements OnDestroy {
  private router = inject(Router);

  orders = signal<Order[]>([]);
  error = signal('');
  updatedAt = signal<Date | null>(null);
  busyId = signal<number | null>(null);
  tab = signal<'open' | 'done'>('open');

  open = computed(() => this.orders().filter((o) => !o.done).reverse()); // oldest first: cook in order
  done = computed(() => this.orders().filter((o) => o.done));
  shown = computed(() => (this.tab() === 'open' ? this.open() : this.done()));
  // ponytail: "today" only counts the latest 100 orders the API returns; add a stats endpoint if a day ever has more.
  today = computed(() => this.orders().filter((o) => new Date(o.createdAt).toDateString() === new Date().toDateString()));
  todayTotal = computed(() => this.today().reduce((sum, o) => sum + o.total, 0));

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
      this.updatedAt.set(new Date());
      this.error.set('');
    } catch (e) {
      this.fail(e);
    }
  }

  async markDone(o: Order) {
    this.busyId.set(o.id);
    try {
      const updated = await api<Order>(`/orders/${o.id}/done`, {});
      this.orders.update((list) => list.map((x) => (x.id === updated.id ? updated : x)));
    } catch (e) {
      this.fail(e);
    } finally {
      this.busyId.set(null);
    }
  }

  logout() {
    shopLogout();
    this.router.navigateByUrl('/login');
  }

  ago(iso: string) {
    const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
    if (min < 1) return 'เมื่อสักครู่';
    if (min < 60) return `${min} นาทีที่แล้ว`;
    if (min < 24 * 60) return `${Math.floor(min / 60)} ชม. ที่แล้ว`;
    return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  }

  // An expired or invalid token sends the shop back to the login page.
  private fail(e: unknown) {
    if (e instanceof ApiError && e.status === 401) this.logout();
    else this.error.set((e as Error).message);
  }
}
