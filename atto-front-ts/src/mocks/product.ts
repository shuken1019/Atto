// src/mocks/products.ts

// ⭐️ 중요: 타입을 가져옵니다.
import type { IProduct } from '../types/product';

// ⭐️ 중요: 가짜 데이터를 만들고 'export' 해야 합니다.
export const mockProducts: IProduct[] = [
  {
    id: 1,
    name: "Relaxed Leas Cardigan",
    price: 70000,
    category: 'outer',
    // 이미지가 없으면 placeholder 사용
    thumbnailImage: "https://via.placeholder.com/450x600/f0f0f0/333333?text=Cardigan",
    detailImages: [],
    description: "편안한 린넨 가디건입니다.",
    variants: [{ color: "Beige", colorCode: "#F5F5DC", sizes: ["S", "M"], stock: 10 }],
    isNew: false
  },
  {
    id: 2,
    name: "Charcali Linen Jacket",
    price: 75000,
    category: 'outer',
    thumbnailImage: "https://via.placeholder.com/450x600/e8e8e8/333333?text=Jacket",
    detailImages: [],
    description: "시원한 차콜 자켓입니다.",
    variants: [{ color: "Charcoal", colorCode: "#36454F", sizes: ["M", "L"], stock: 5 }],
    isNew: true
  },
  {
    id: 3,
    name: "Relaxed Tate-shirt",
    price: 70000,
    category: 'top',
    thumbnailImage: "https://via.placeholder.com/450x600/f5f5f5/333333?text=T-shirt",
    detailImages: [],
    description: "기본 린넨 티셔츠입니다.",
    variants: [{ color: "Beige", colorCode: "#F5F5DC", sizes: ["S", "M", "L"], stock: 20 }],
    isNew: false
  }
];