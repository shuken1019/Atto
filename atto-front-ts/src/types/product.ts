// src/types/product.ts

// 카테고리 타입 제한
export type CategoryType = 'top' | 'bottom' | 'outer' | 'acc';

// 상품 색상/사이즈 옵션 인터페이스
export interface IProductVariant {
  color: string;
  colorCode: string;
  sizes: string[];
  stock: number;
}

// 상품 메인 인터페이스
export interface IProduct {
  id: number;
  name: string;
  price: number;
  category: CategoryType;
  thumbnailImage: string; // 임시 이미지 URL 경로
  detailImages: string[];
  description: string;
  variants: IProductVariant[];
  isNew: boolean; // 신상품 여부
}