import type { CategoryType, IProduct } from '../types/product';
import { mockProducts } from '../mocks/product';

const API_BASE = 'http://127.0.0.1:4000';

type AdminProductRow = {
  productId: number;
  name: string;
  description: string;
  price: number;
  categoryId: number;
  status: 'ON_SALE' | 'SOLD_OUT' | 'HIDDEN';
  thumbnail: string | null;
  created_at: string;
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

const toBaseProduct = (row: AdminProductRow): IProduct => {
  const thumbnailImage = row.thumbnail && row.thumbnail.trim() ? row.thumbnail : fallbackImage(Number(row.productId));
  return {
    id: Number(row.productId),
    name: String(row.name ?? ''),
    price: Number(row.price ?? 0),
    category: categoryFromId(Number(row.categoryId)),
    thumbnailImage,
    representativeImages: [thumbnailImage],
    detailImages: [thumbnailImage],
    detailMedia: [{ type: 'image', url: thumbnailImage }],
    description: String(row.description ?? ''),
    detailDescription: String(row.description ?? ''),
    sizeGuide: [],
    keyInfo: [],
    variants: [],
    isNew: isNewByCreatedAt(String(row.created_at ?? '')),
  };
};

const fetchColorMap = async (): Promise<Map<number, ColorRow>> => {
  const response = await fetch(`${API_BASE}/api/admin/colors`);
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

export const getProducts = async (): Promise<IProduct[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/admin/products`);
    const result = await response.json();

    if (!response.ok || !result.ok || !Array.isArray(result.products)) {
      return mockProducts;
    }

    const rows = result.products as AdminProductRow[];
    return rows
      .filter((row) => String(row.status ?? 'ON_SALE') !== 'HIDDEN')
      .map((row) => toBaseProduct(row));
  } catch {
    return mockProducts;
  }
};

export const getProductById = async (id: number): Promise<IProduct | undefined> => {
  try {
    const [productResponse, colorMap] = await Promise.all([
      fetch(`${API_BASE}/api/admin/products/${id}`),
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
      `재고 합계: ${(result.productColors ?? []).reduce((sum, row) => sum + Number(row.stock ?? 0), 0)}개`,
    ];

    product.sizeGuide = Array.from(sizeLabelById.values()).map((size) => ({
      label: size,
      shoulder: '-',
      chest: '-',
      length: '-',
    }));

    return product;
  } catch {
    return mockProducts.find((product) => product.id === id);
  }
};
