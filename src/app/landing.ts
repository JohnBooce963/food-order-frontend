import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { imgFallback, loadMenu, MenuItem, minPrice, NO_IMAGE } from './api';

@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  template: `
    <section class="hero">
      <div class="hero-text">
        <p class="eyebrow">อาหารไทย · สั่งออนไลน์ รับที่ร้าน</p>
        <h1>ไม่รู้จะกินอะไร?<br /><span>Mai Roo</span> ช่วยเลือกให้</h1>
        <p class="lead">
          เมนู{{ menu().length ? ' ' + menu().length + ' รายการ' : '' }} ตั้งแต่ของทอด แกง ต้มยำ ไปจนถึงยำรสจัด
          เลือกเมนู ใส่ตะกร้า แล้วกดสั่งได้เลย
        </p>
        <div class="actions">
          <a class="btn primary big" routerLink="/menu">ดูเมนูและสั่งอาหาร</a>
          <button class="btn big" [disabled]="!orderable().length" (click)="surprise()">สุ่มเมนูให้หน่อย 🎲</button>
        </div>
        @if (pick(); as p) {
          <a class="pick" routerLink="/menu" [queryParams]="{ cat: p.category }">
            วันนี้ลอง <b>{{ p.name }}</b> ไหม? · เริ่มต้น ฿{{ minPrice(p) }} →
          </a>
        }
      </div>
      <div class="hero-art" aria-hidden="true">
        <span>🍤</span><span>🍛</span><span>🍲</span><span>🥗</span>
      </div>
    </section>

    @if (error()) {
      <p class="error">{{ error() }}</p>
    }

    @if (popular().length) {
      <section class="block">
        <div class="section-head">
          <h2>เมนูขายดี</h2>
          <a routerLink="/menu" [queryParams]="{ cat: 'ขายดี' }">ดูทั้งหมด →</a>
        </div>
        <div class="grid">
          @for (f of popular(); track f.id) {
            <a class="card dish link" routerLink="/menu" [queryParams]="{ cat: f.category }">
              <div class="dish-img">
                <img [src]="f.img || noImage" [alt]="f.name" loading="lazy" (error)="imgFallback($event)" />
                <span class="badge">ขายดี</span>
              </div>
              <div class="dish-body">
                <h3>{{ f.name }}</h3>
                <p class="muted small">
                  {{ f.category }}@if (f.options.length) { · เริ่มต้น ฿{{ minPrice(f) }}}
                </p>
              </div>
            </a>
          }
        </div>
      </section>
    }

    @if (categories().length) {
      <section class="block">
        <h2>หมวดหมู่</h2>
        <div class="chips wrap">
          @for (c of categories(); track c.name) {
            <a class="chip" routerLink="/menu" [queryParams]="{ cat: c.name }">{{ c.name }} <small>{{ c.count }}</small></a>
          }
        </div>
      </section>
    }

    <section class="block">
      <h2>สั่งยังไง</h2>
      <ol class="steps">
        <li><b>1</b><h3>เลือกเมนู</h3><p>ดูตามหมวด หรือค้นหาชื่ออาหาร แล้วกดเลือกขนาดที่ต้องการ</p></li>
        <li><b>2</b><h3>ใส่ชื่อแล้วสั่ง</h3><p>ตรวจของในตะกร้า ใส่ชื่อผู้สั่ง แล้วกดสั่งอาหาร</p></li>
        <li><b>3</b><h3>รอรับที่ร้าน</h3><p>จำเลขออเดอร์ไว้ ร้านจะเรียกชื่อเมื่ออาหารพร้อม</p></li>
      </ol>
    </section>
  `,
})
export class LandingPage {
  protected readonly noImage = NO_IMAGE;
  protected readonly imgFallback = imgFallback;
  protected readonly minPrice = minPrice;

  menu = signal<MenuItem[]>([]);
  error = signal('');
  pick = signal<MenuItem | null>(null);
  orderable = computed(() => this.menu().filter((f) => f.options.length));
  popular = computed(() => this.orderable().filter((f) => f.popular).slice(0, 8));
  categories = computed(() => {
    const counts = new Map<string, number>();
    for (const f of this.menu()) counts.set(f.category, (counts.get(f.category) ?? 0) + 1);
    return [...counts].map(([name, count]) => ({ name, count }));
  });

  constructor() {
    loadMenu().then(
      (m) => this.menu.set(m),
      (e: Error) => this.error.set(e.message),
    );
  }

  surprise() {
    const list = this.orderable();
    this.pick.set(list[Math.floor(Math.random() * list.length)] ?? null);
  }
}
