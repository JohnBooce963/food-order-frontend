import { Component, computed, input, linkedSignal, signal } from '@angular/core';
import { api, imgFallback, loadMenu, MenuItem, NO_IMAGE, Order } from './api';

type CartLine = { priceId: number; name: string; size: string | null; price: number; qty: number };

const ALL = 'ทั้งหมด';
const POPULAR = 'ขายดี';

@Component({
  selector: 'app-menu',
  template: `
    <div class="menu-page">
      <section class="menu-main">
        <header class="menu-head">
          <h1>เมนูอาหาร</h1>
          <input
            class="search"
            type="search"
            placeholder="ค้นหาเมนู เช่น ต้มยำ, กะเพรา"
            aria-label="ค้นหาเมนู"
            [value]="query()"
            (input)="search($any($event.target).value)"
          />
        </header>

        <nav class="chips sticky" aria-label="หมวดหมู่">
          @for (c of tabs(); track c) {
            <button class="chip" [class.on]="c === active()" (click)="pickTab(c)">{{ c }}</button>
          }
        </nav>

        @if (loadError()) {
          <p class="error">{{ loadError() }}</p>
        } @else if (!menu()) {
          <p class="muted">กำลังโหลดเมนู…</p>
        }

        @for (s of sections(); track s.name) {
          <section class="menu-section">
            <h2>{{ s.name }} <small class="muted">{{ s.items.length }} รายการ</small></h2>
            <div class="grid">
              @for (f of s.items; track f.id) {
                <article class="card dish" [class.unavailable]="!f.options.length">
                  <div class="dish-img">
                    <img [src]="f.img || noImage" [alt]="f.name" loading="lazy" (error)="imgFallback($event)" />
                    @if (f.popular) {
                      <span class="badge">ขายดี</span>
                    }
                  </div>
                  <div class="dish-body">
                    <h3>{{ f.name }}</h3>
                    <div class="options">
                      @for (o of f.options; track o.priceId) {
                        <button class="option" (click)="add(f, o)" [attr.aria-label]="'เพิ่ม ' + f.name + ' ' + (o.size ?? '')">
                          <span>{{ o.size ?? 'ปกติ' }}</span>
                          <b>฿{{ o.price }}</b>
                          @if (qty()[o.priceId]; as q) {
                            <span class="in-cart">{{ q }}</span>
                          }
                        </button>
                      } @empty {
                        <span class="muted small">ยังไม่เปิดขาย</span>
                      }
                    </div>
                  </div>
                </article>
              }
            </div>
          </section>
        } @empty {
          @if (menu()) {
            <p class="empty">ไม่พบเมนู "{{ query() }}"</p>
          }
        }
      </section>

      <aside class="cart card" id="cart">
        @if (placed(); as o) {
          <div class="success">
            <p class="big-check" aria-hidden="true">✓</p>
            <h2>สั่งอาหารสำเร็จ</h2>
            <p class="order-no">#{{ o.id }}</p>
            <p class="muted">ร้านได้รับออเดอร์ของ <b>{{ o.customerName }}</b> แล้ว รอเรียกชื่อได้เลย</p>
            <ul class="lines">
              @for (i of o.items; track i.id) {
                <li>
                  <span>{{ i.qty }} × {{ i.foodName }}@if (i.sizeName) { ({{ i.sizeName }})}</span>
                  <span>฿{{ i.unitPrice * i.qty }}</span>
                </li>
              }
            </ul>
            <p class="total"><span>รวม</span><span>฿{{ o.total }}</span></p>
            <button class="btn primary big" (click)="placed.set(null)">สั่งเพิ่ม</button>
          </div>
        } @else {
          <div class="cart-head">
            <h2>ตะกร้าของคุณ</h2>
            @if (cart().length) {
              <button class="link-btn" (click)="cart.set([])">ล้างตะกร้า</button>
            }
          </div>
          @for (l of cart(); track l.priceId) {
            <div class="line">
              <div>
                <p>{{ l.name }}</p>
                <p class="muted small">{{ l.size ?? 'ปกติ' }} · ฿{{ l.price }}</p>
              </div>
              <div class="qty">
                <button (click)="bump(l, -1)" aria-label="ลดจำนวน">−</button>
                <span>{{ l.qty }}</span>
                <button (click)="bump(l, 1)" aria-label="เพิ่มจำนวน">+</button>
              </div>
              <b>฿{{ l.price * l.qty }}</b>
            </div>
          } @empty {
            <p class="empty small">ยังไม่ได้เลือกเมนู กดที่ขนาดและราคาเพื่อใส่ตะกร้า</p>
          }
          <p class="total"><span>รวม {{ count() }} รายการ</span><span>฿{{ total() }}</span></p>
          <form (submit)="place($event)">
            <label>
              ชื่อผู้สั่ง
              <input
                [value]="name()"
                (input)="name.set($any($event.target).value)"
                maxlength="50"
                placeholder="ใช้เรียกตอนอาหารพร้อม"
                autocomplete="name"
              />
            </label>
            <button class="btn primary big" [disabled]="!cart().length || !name().trim() || busy()">
              {{ busy() ? 'กำลังสั่ง…' : 'สั่งอาหาร · ฿' + total() }}
            </button>
          </form>
          @if (orderError()) {
            <p class="error" role="alert">{{ orderError() }}</p>
          }
        }
      </aside>
    </div>

    @if (count() && !placed()) {
      <button class="cart-bar" (click)="scrollToCart()">
        <span>ดูตะกร้า · {{ count() }} รายการ</span>
        <b>฿{{ total() }}</b>
      </button>
    }
  `,
})
export class MenuPage {
  protected readonly noImage = NO_IMAGE;
  protected readonly imgFallback = imgFallback;

  // ?cat= from the landing page picks the starting tab.
  cat = input<string>();
  active = linkedSignal(() => this.cat() ?? ALL);
  query = signal('');

  menu = signal<MenuItem[] | null>(null);
  loadError = signal('');
  cart = signal<CartLine[]>([]);
  name = signal('');
  busy = signal(false);
  orderError = signal('');
  placed = signal<Order | null>(null);

  total = computed(() => this.cart().reduce((sum, l) => sum + l.price * l.qty, 0));
  count = computed(() => this.cart().reduce((sum, l) => sum + l.qty, 0));
  qty = computed(() => Object.fromEntries(this.cart().map((l) => [l.priceId, l.qty])) as Record<number, number>);

  tabs = computed(() => {
    const m = this.menu() ?? [];
    return [ALL, ...(m.some((f) => f.popular) ? [POPULAR] : []), ...new Set(m.map((f) => f.category))];
  });

  // Dishes grouped by category, in menu order. Searching looks through every category.
  sections = computed(() => {
    const q = this.query().trim().toLowerCase();
    const tab = q ? ALL : this.active();
    let items = (this.menu() ?? []).filter((f) => !q || f.name.toLowerCase().includes(q));
    if (tab === POPULAR) return [{ name: POPULAR, items: items.filter((f) => f.popular) }];
    if (tab !== ALL) items = items.filter((f) => f.category === tab);
    const groups = new Map<string, MenuItem[]>();
    for (const f of items) groups.set(f.category, [...(groups.get(f.category) ?? []), f]);
    return [...groups].map(([name, items]) => ({ name, items }));
  });

  constructor() {
    loadMenu().then(
      (m) => this.menu.set(m),
      (e: Error) => this.loadError.set(e.message),
    );
  }

  search(q: string) {
    this.query.set(q);
  }

  pickTab(tab: string) {
    this.query.set('');
    this.active.set(tab);
  }

  add(f: MenuItem, o: MenuItem['options'][number]) {
    const line = this.cart().find((l) => l.priceId === o.priceId);
    if (line) this.bump(line, 1);
    else this.cart.update((c) => [...c, { priceId: o.priceId, name: f.name, size: o.size, price: o.price, qty: 1 }]);
  }

  bump(line: CartLine, by: number) {
    const qty = Math.min(line.qty + by, 99); // the server caps qty at 99 too
    this.cart.update((c) => (qty < 1 ? c.filter((l) => l !== line) : c.map((l) => (l === line ? { ...l, qty } : l))));
  }

  scrollToCart() {
    document.getElementById('cart')?.scrollIntoView({ behavior: 'smooth' });
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
      this.placed.set(order);
      this.cart.set([]);
      this.scrollToCart();
    } catch (err) {
      this.orderError.set((err as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
}
