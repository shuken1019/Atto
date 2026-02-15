// src/services/productService.ts

import type { IProduct } from '../types/product';
// 방금 만든 파일에서 mockProducts를 가져옵니다.
import { mockProducts } from '../mocks/product';

export const getProducts = async (): Promise<IProduct[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockProducts;
};

export const getProductById = async (id: number): Promise<IProduct | undefined> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  // mockProducts가 IProduct[] 타입이므로, product는 자동으로 IProduct 타입이 됩니다.
  // 따라서 'any' 에러가 사라집니다.
  return mockProducts.find((product) => product.id === id);
};