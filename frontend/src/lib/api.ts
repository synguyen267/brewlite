export type Product = {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_URL}/products`);
  if (!res.ok) throw new Error('Không tải được danh sách sản phẩm');
  return res.json();
}