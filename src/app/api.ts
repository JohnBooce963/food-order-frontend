import { signal } from '@angular/core';

// Backend URL: the local dev server, or the Railway deployment everywhere else.
export const API =
  location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://foodservice-production-ee0a.up.railway.app';

export const NO_IMAGE = '/no-image.svg';

export type MenuItem = {
  id: string;
  name: string;
  category: string;
  popular: boolean;
  img: string | null;
  options: { priceId: number; size: string | null; price: number }[];
};

export type Order = {
  id: number;
  customerName: string;
  total: number;
  done: boolean;
  createdAt: string;
  items: { id: number; foodName: string; sizeName: string | null; unitPrice: number; qty: number }[];
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

// Server reasons are English; the ones a person actually sees get a Thai message.
const THAI: Record<number, string> = {
  401: 'กรุณาเข้าสู่ระบบร้านก่อน',
  429: 'ใส่รหัสผิดหลายครั้ง รอสักครู่แล้วลองใหม่',
  503: 'ร้านยังไม่ได้ตั้งรหัสผ่าน (SHOP_PASSWORD)',
};

// GET when there is no body, POST JSON otherwise. Sends the shop token when there is one.
export async function api<T>(path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (shopToken()) headers['Authorization'] = `Bearer ${shopToken()}`;
  let res: Response;
  try {
    res = await fetch(API + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('ติดต่อเซิร์ฟเวอร์ไม่ได้ ลองใหม่อีกครั้ง', 0);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const wrongPassword = res.status === 401 && path === '/auth/login';
    throw new ApiError(wrongPassword ? 'รหัสผ่านไม่ถูกต้อง' : (THAI[res.status] ?? data?.detail ?? `เกิดข้อผิดพลาด (${res.status})`), res.status);
  }
  return data as T;
}

// The menu rarely changes, so the landing and menu pages share one request per visit.
let menuRequest: Promise<MenuItem[]> | null = null;
export function loadMenu(): Promise<MenuItem[]> {
  return (menuRequest ??= api<MenuItem[]>('/foods').catch((e) => {
    menuRequest = null;
    throw e;
  }));
}

export const minPrice = (f: MenuItem) => Math.min(...f.options.map((o) => o.price));

// <img (error)="imgFallback($event)">: broken image URLs fall back to the placeholder too.
export function imgFallback(e: Event) {
  const img = e.target as HTMLImageElement;
  if (!img.src.endsWith(NO_IMAGE)) img.src = NO_IMAGE;
}

// Shop login: the token lives in localStorage until it expires (12 h) or the shop logs out.
const TOKEN_KEY = 'mai-roo-shop';

export const shopToken = signal<string | null>(readToken());

function readToken(): string | null {
  try {
    const t = JSON.parse(localStorage.getItem(TOKEN_KEY) ?? 'null');
    return t && t.expiresAt * 1000 > Date.now() ? t.token : null;
  } catch {
    return null;
  }
}

export async function shopLogin(password: string) {
  const t = await api<{ token: string; expiresAt: number }>('/auth/login', { password });
  try {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(t));
  } catch {}
  shopToken.set(t.token);
}

export function shopLogout() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
  shopToken.set(null);
}
