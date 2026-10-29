// Backend URL. ponytail: one constant; move to Angular environments once there is a deployed backend too.
export const API = 'http://localhost:8080';

export type MenuItem = {
  id: string;
  name: string;
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

// GET when there is no body, POST JSON otherwise. Errors carry the server's message (problem JSON "detail").
export async function api<T>(path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(
      API + path,
      body === undefined
        ? {}
        : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    );
  } catch {
    throw new Error('ติดต่อเซิร์ฟเวอร์ไม่ได้');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.detail ?? `เกิดข้อผิดพลาด (${res.status})`);
  return data as T;
}
