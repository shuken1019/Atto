// src/mocks/products.ts (또는 product.ts)

import type { IProduct } from '../types/product';

const makeRepresentativeImages = (seed: string) => [
  `https://picsum.photos/seed/${seed}-1/900/1200`,
  `https://picsum.photos/seed/${seed}-2/900/1200`,
  `https://picsum.photos/seed/${seed}-3/900/1200`,
];

const makeSizeGuide = () => [
  { label: 'S', shoulder: '44', chest: '51', length: '67' },
  { label: 'M', shoulder: '46', chest: '54', length: '69' },
  { label: 'L', shoulder: '48', chest: '57', length: '71' },
];

const makeKeyInfo = () => ['소재: Linen 70% / Cotton 30%', '제조국: 대한민국', '세탁: 드라이클리닝 권장'];

const createBaseProduct = (seed: string) => {
  const representativeImages = makeRepresentativeImages(seed);
  return {
    thumbnailImage: representativeImages[0],
    representativeImages,
    detailImages: representativeImages,
    detailMedia: [
      { type: 'image' as const, url: `https://picsum.photos/seed/${seed}-detail-1/1200/1600` },
      { type: 'image' as const, url: `https://picsum.photos/seed/${seed}-detail-2/1200/1600` },
      { type: 'video' as const, url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    ],
    detailDescription:
      '자연스러운 실루엣과 편안한 착용감을 기반으로 제작된 아이템입니다. 다양한 스타일에 매칭이 쉽고, 일상에서 손이 자주 가는 균형감 있는 핏을 제공합니다.',
    sizeGuide: makeSizeGuide(),
    keyInfo: makeKeyInfo(),
  };
};

export const mockProducts: IProduct[] = [
  {
    id: 1,
    name: "Relaxed Leas Cardigan",
    price: 70000,
    category: 'outer',
    ...createBaseProduct('cardigan'),
    description: "편안한 린넨 가디건입니다.",
    variants: [{ color: "Beige", colorCode: "#F5F5DC", sizes: ["S", "M"], stock: 10 }],
    isNew: false
  },
  {
    id: 2,
    name: "Charcali Linen Jacket",
    price: 75000,
    category: 'outer',
    ...createBaseProduct('jacket'),
    description: "시원한 차콜 자켓입니다.",
    variants: [{ color: "Charcoal", colorCode: "#36454F", sizes: ["M", "L"], stock: 5 }],
    isNew: true
  },
  {
    id: 3,
    name: "Relaxed Tate-shirt",
    price: 42000,
    category: 'top',
    ...createBaseProduct('tshirt'),
    description: "기본 린넨 티셔츠입니다.",
    variants: [{ color: "Beige", colorCode: "#F5F5DC", sizes: ["S", "M", "L"], stock: 20 }],
    isNew: false
  },
  {
    id: 4,
    name: "Wide Cotton Pants",
    price: 68000,
    category: 'bottom',
    ...createBaseProduct('pants'),
    description: "와이드 핏 코튼 팬츠입니다.",
    variants: [],
    isNew: false
  },
  {
    id: 5,
    name: "Silver Loop Ring",
    price: 35000,
    category: 'acc',
    ...createBaseProduct('ring'),
    description: "심플한 실버 링입니다.",
    variants: [],
    isNew: true
  },
  {
    id: 6,
    name: "Daily Linen Shirts",
    price: 55000,
    category: 'top',
    ...createBaseProduct('shirt'),
    description: "데일리로 입기 좋은 셔츠입니다.",
    variants: [],
    isNew: false
  }
];
