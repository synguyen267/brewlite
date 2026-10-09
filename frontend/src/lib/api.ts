export type Product = {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
};

export type OrderLine = {
  productId: number;
  size: string;
  toppings: string[];
  qty: number;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function readError(res: Response, fallback: string) {
  try {
    const body = await res.json();
    const msg = body?.message;
    return Array.isArray(msg) ? msg.join(', ') : (msg ?? fallback);
  } catch {
    return fallback;
  }
}

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_URL}/products`);
  if (!res.ok) throw new Error('Không tải được danh sách sản phẩm');
  return res.json();
}

export async function fetchProduct(id: number): Promise<Product> {
  const res = await fetch(`${API_URL}/products/${id}`);
  if (res.status === 404) throw new Error('Không tìm thấy sản phẩm');
  if (!res.ok) throw new Error('Không tải được sản phẩm');
  return res.json();
}

export async function registerUser(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new ApiError(await readError(res, 'Đăng ký thất bại'), res.status);
  }
  return res.json();
}

export async function loginUser(
  email: string,
  password: string,
): Promise<{ accessToken: string; user: { id: number; email: string } }> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new ApiError(await readError(res, 'Đăng nhập thất bại'), res.status);
  }
  return res.json();
}

export async function createOrder(
  token: string,
  items: OrderLine[],
): Promise<{ id: number; status: string; total: number }> {
  const res = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    throw new ApiError(await readError(res, 'Không tạo được đơn'), res.status);
  }
  return res.json();
}