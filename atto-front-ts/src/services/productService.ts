import type { CategoryType, IProduct } from '../types/product';
import { API_BASE_URL } from '../config/api';
import { authFetch } from '../utils/authFetch';
import { mockProducts } from '../mocks/product';

const API_BASE = API_BASE_URL;
const USE_MOCK_FALLBACK = Boolean(import.meta.env.DEV);

export type AdminProductRow = {
  productId: number;
  name: string;
  description: string;
  price: number;
  categoryId: number;
  status: 'ON_SALE' | 'SOLD_OUT' | 'HIDDEN';
  thumbnail: string | null;
  created_at: string;
  isLive?: number | boolean;
  totalStock?: number;
};

type AdminProductDetail = {
  ok: boolean;
  product: AdminProductRow;
  productColors: Array<{ colorId: number; stock: number }>;
  productOptions: Array<{ colorId: number; sizeId: number; stock: number }>;
};

type ColorRow = {
  colorId: number;
  name: string;
  code: string;
};

const categoryFromId = (categoryId: number): CategoryType => {
  if (categoryId === 1) return 'outer';
  if (categoryId === 2) return 'top';
  if (categoryId === 3) return 'bottom';
  if (categoryId === 4) return 'acc';
  return 'top';
};

const isNewByCreatedAt = (createdAt: string): boolean => {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;
  const diffMs = Date.now() - created.getTime();
  return diffMs <= 14 * 24 * 60 * 60 * 1000;
};

const fallbackImage = (productId: number): string => `https://picsum.photos/seed/product-${productId}/900/1200`;

const sizeLabelFromId = (sizeId: number): string => {
  if (sizeId === 1) return 'S';
  if (sizeId === 2) return 'M';
  if (sizeId === 3) return 'L';
  return `SIZE-${sizeId}`;
};

const toBaseProduct = (row: AdminProductRow & { detail_images?: string; detail_text?: string }): IProduct => {
  const thumbnailImage = row.thumbnail && row.thumbnail.trim() ? row.thumbnail : fallbackImage(Number(row.productId));

  type DetailBlock = { url: string; text?: string };
  let detailBlocks: DetailBlock[] = [];
  try {
    const parsed = JSON.parse(String(row.detail_images ?? '[]'));
    if (Array.isArray(parsed)) {
      detailBlocks = parsed
        .map((item) => {
          if (typeof item === 'string') return { url: item, text: '' };
          if (item && typeof item.url === 'string') return { url: item.url, text: String(item.text ?? '') };
          return null;
        })
        .filter((b): b is DetailBlock => b !== null && b.url.length > 0);
    }
  } catch { /* empty */ }

  const detailMedia = detailBlocks.length > 0
    ? detailBlocks.map((b) => ({ type: 'image' as const, url: b.url, text: b.text }))
    : [{ type: 'image' as const, url: thumbnailImage, text: '' }];

  return {
    id: Number(row.productId),
    name: String(row.name ?? ''),
    price: Number(row.price ?? 0),
    category: categoryFromId(Number(row.categoryId)),
    thumbnailImage,
    representativeImages: [thumbnailImage],
    detailImages: detailBlocks.length > 0 ? detailBlocks.map((b) => b.url) : [thumbnailImage],
    detailMedia,
    description: String(row.description ?? ''),
    detailDescription: '',
    sizeGuide: [],
    keyInfo: [],
    variants: [],
    isNew: isNewByCreatedAt(String(row.created_at ?? '')),
    isLive: Number(row.isLive ?? 0) === 1,
  };
};

const fetchColorMap = async (): Promise<Map<number, ColorRow>> => {
  const response = await authFetch(`${API_BASE}/api/admin/colors`);
  const result = await response.json();
  const map = new Map<number, ColorRow>();

  if (!response.ok || !result.ok || !Array.isArray(result.colors)) return map;

  for (const item of result.colors as ColorRow[]) {
    const colorId = Number(item.colorId);
    if (!Number.isInteger(colorId) || colorId <= 0) continue;
    map.set(colorId, {
      colorId,
      name: String(item.name ?? ''),
      code: String(item.code ?? '#dddddd'),
    });
  }

  return map;
};

export const getAdminProducts = async (): Promise<AdminProductRow[]> => {
  const response = await authFetch(`${API_BASE}/api/admin/products`);
  const result = await response.json();

  if (!response.ok || !result.ok || !Array.isArray(result.products)) {
    throw new Error(result?.message ?? '상품 목록을 불러오지 못했습니다.');
  }

  return result.products as AdminProductRow[];
};

export const toggleAdminProductLive = async (productId: number, isLive: boolean): Promise<void> => {
  const response = await authFetch(`${API_BASE}/api/admin/products/${productId}/live`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isLive: isLive ? 1 : 0 }),
  });
  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(result?.message ?? '라이브 상태 변경에 실패했습니다.');
  }
};

export const deleteAdminProduct = async (productId: number): Promise<void> => {
  const response = await authFetch(`${API_BASE}/api/admin/products/${productId}`, {
    method: 'DELETE',
  });
  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(result?.message ?? '상품 삭제에 실패했습니다.');
  }
};

export const getProducts = async (): Promise<IProduct[]> => {
  try {
    const rows = await getAdminProducts();
    return rows
      .filter((row) => String(row.status ?? 'ON_SALE') !== 'HIDDEN')
      .map((row) => toBaseProduct(row));
  } catch (error) {
    if (USE_MOCK_FALLBACK) return mockProducts;
    console.error('getProducts failed:', error);
    return [];
  }
};

export const getProductById = async (id: number): Promise<IProduct | undefined> => {
  try {
    const [productResponse, colorMap] = await Promise.all([
      authFetch(`${API_BASE}/api/admin/products/${id}`),
      fetchColorMap(),
    ]);

    const result = (await productResponse.json()) as AdminProductDetail;
    if (!productResponse.ok || !result.ok || !result.product) {
      return mockProducts.find((product) => product.id === id);
    }

    const product = toBaseProduct(result.product);

    const sizesByColor = new Map<number, string[]>();
    const sizeLabelById = new Map<number, string>();

    for (const option of result.productOptions ?? []) {
      const colorId = Number(option.colorId);
      const sizeId = Number(option.sizeId);
      const stock = Number(option.stock ?? 0);
      if (!Number.isInteger(colorId) || !Number.isInteger(sizeId)) continue;

      const sizeLabel = sizeLabelFromId(sizeId);
      sizeLabelById.set(sizeId, sizeLabel);
      if (stock <= 0) continue;

      const prev = sizesByColor.get(colorId) ?? [];
      if (!prev.includes(sizeLabel)) {
        prev.push(sizeLabel);
      }
      sizesByColor.set(colorId, prev);
    }

    product.variants = (result.productColors ?? []).map((row) => {
      const colorId = Number(row.colorId);
      const meta = colorMap.get(colorId);
      return {
        colorId,
        color: meta?.name || `Color-${colorId}`,
        colorCode: meta?.code || '#dddddd',
        sizes: sizesByColor.get(colorId) ?? [],
        stock: Number(row.stock ?? 0),
      };
    });

    product.keyInfo = [
      `총 재고: ${(result.productColors ?? []).reduce((sum, row) => sum + Number(row.stock ?? 0), 0)}`,
    ];

    product.sizeGuide = Array.from(sizeLabelById.values()).map((size) => ({
      label: size,
      shoulder: '-',
      chest: '-',
      length: '-',
    }));

    return product;
  } catch (error) {
    if (USE_MOCK_FALLBACK) return mockProducts.find((product) => product.id === id);
    console.error(`getProductById(${id}) failed:`, error);
    return undefined;
  }
};
