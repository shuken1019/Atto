// src/mocks/products.ts (또는 product.ts)

import type { IProduct } from '../types/product';

// 🚨 에러의 원인이던 이미지 import 코드를 모두 지웠습니다!
// import img1 from ... (삭제됨)

// 대신 이 가짜 주소를 쓰면, ProductCard가 알아서 예쁜 SVG 그림을 보여줄 겁니다.
const PLACEHOLDER_URL = "https://via.placeholder.com/450x600"; 

export const mockProducts: IProduct[] = [
  {
    id: 1,
    name: "Relaxed Leas Cardigan",
    price: 70000,
    category: 'outer',
    thumbnailImage: PLACEHOLDER_URL, // ⭐️ 변수(img1) 대신 문자열 사용
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
    thumbnailImage: PLACEHOLDER_URL,
    detailImages: [],
    description: "시원한 차콜 자켓입니다.",
    variants: [{ color: "Charcoal", colorCode: "#36454F", sizes: ["M", "L"], stock: 5 }],
    isNew: true
  },
  {
    id: 3,
    name: "Relaxed Tate-shirt",
    price: 42000,
    category: 'top',
    thumbnailImage: PLACEHOLDER_URL,
    detailImages: [],
    description: "기본 린넨 티셔츠입니다.",
    variants: [{ color: "Beige", colorCode: "#F5F5DC", sizes: ["S", "M", "L"], stock: 20 }],
    isNew: false
  },
  {
    id: 4,
    name: "Wide Cotton Pants",
    price: 68000,
    category: 'bottom',
    thumbnailImage: PLACEHOLDER_URL,
    detailImages: [],
    description: "와이드 핏 코튼 팬츠입니다.",
    variants: [],
    isNew: false
  },
  {
    id: 5,
    name: "Silver Loop Ring",
    price: 35000,
    category: 'acc',
    thumbnailImage: PLACEHOLDER_URL,
    detailImages: [],
    description: "심플한 실버 링입니다.",
    variants: [],
    isNew: true
  },
  {
    id: 6,
    name: "Daily Linen Shirts",
    price: 55000,
    category: 'top',
    thumbnailImage: PLACEHOLDER_URL,
    detailImages: [],
    description: "데일리로 입기 좋은 셔츠입니다.",
    variants: [],
    isNew: false
  }
];