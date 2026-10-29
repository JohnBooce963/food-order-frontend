import { Component, computed, signal } from '@angular/core';
import { api, MenuItem, Order } from './api';

type CartLine = { priceId: number; name: string; size: string | null; price: number; qty: number };

@Component({
  selector: 'app-menu',
  template: `
    <div class="layout">
      <section>
        @if (loadError()) {
          <p class="error">{{ loadError() }}</p>
        } @else if (!menu()) {
          <p class="muted">กำลังโหลดเมนู…</p>
        }
        <div class="grid">
          @for (f of menu(); track f.id) {
            <article class="card">
              @if (f.img) {
                <img [src]="f.img" [alt]="f.name" loading="lazy" />
              }
              <h3>
                {{ f.name }}
                @if (f.popular) {
                  <span class="badge">ขายดี</span>
                }
              </h3>
              <div class="options">
                @for (o of f.options; track o.priceId) {
                  <button (click)="add(f, o)">{{ o.size ?? 'ปกติ' }} · ฿{{ o.price }}</button>
                } @empty {
                  <span class="muted">ยังไม่มีราคา</span>
                }
              </div>
            </article>
          } @empty {
            @if (menu()) {
              <p class="muted">ยังไม่มีเมนู</p>
            }
          }
        </div>
      </section>

      <aside class="cart">
        <h2>ตะกร้า</h2>
        @for (l of cart(); track l.priceId) {
          <div class="line">
            <span>{{ l.name }}@if (l.size) { ({{ l.size }})}</span>
            <span class="qty">
              <button (click)="bump(l, -1)" aria-label="ลด">−</button>
              {{ l.qty }}
              <button (click)="bump(l, 1)" aria-label="เพิ่ม">+</button>
            </span>
            <span>฿{{ l.price * l.qty }}</span>
          </div>
        } @empty {
          <p class="muted">ยังไม่ได้เลือกอะไร</p>
        }
        <p class="total">รวม ฿{{ total() }}</p>
        <form (submit)="place($event)">
          <label>
            ชื่อผู้สั่ง
            <input [value]="name()" (input)="name.set($any($event.target).value)" maxlength="50" />
          </label>
          <button class="primary" [disabled]="!cart().length || !name().trim() || busy()">สั่งอาหาร</button>
        </form>
        @if (orderError()) {
          <p class="error">{{ orderError() }}</p>
        }
        @if (placed()) {
          <p class="ok">รับออเดอร์ #{{ placed() }} แล้ว</p>
        }
      </aside>
    </div>
  `,
})
export class MenuPage {
  menu = signal<MenuItem[] | null>(null);
  loadError = signal('');
  cart = signal<CartLine[]>([]);
  total = computed(() => this.cart().reduce((sum, l) => sum + l.price * l.qty, 0));
  name = signal('');
  busy = signal(false);
  orderError = signal('');
  placed = signal<number | null>(null);

  constructor() {
    api<MenuItem[]>('/foods').then(
      (m) => this.menu.set(m),
      (e: Error) => this.loadError.set(e.message),
    );
  }

  add(f: MenuItem, o: MenuItem['options'][number]) {
    this.placed.set(null);
    const line = this.cart().find((l) => l.priceId === o.priceId);
    if (line) this.bump(line, 1);
    else this.cart.update((c) => [...c, { priceId: o.priceId, name: f.name, size: o.size, price: o.price, qty: 1 }]);
  }

  bump(line: CartLine, by: number) {
    const qty = Math.min(line.qty + by, 99); // the server caps qty at 99 too
    this.cart.update((c) =>
      qty < 1 ? c.filter((l) => l !== line) : c.map((l) => (l === line ? { ...l, qty } : l)),
    );
  }

  async place(e: Event) {
    e.preventDefault();
    this.busy.set(true);
    this.orderError.set('');
    try {
      const order = await api<Order>('/orders', {
        customerName: this.name(),
        items: this.cart().map((l) => ({ priceId: l.priceId, qty: l.qty })),
      });
      this.placed.set(order.id);
      this.cart.set([]);
    } catch (err) {
      this.orderError.set((err as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
}
