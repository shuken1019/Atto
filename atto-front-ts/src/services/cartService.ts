type StoredUser = {
  userId: number;
};

export type CartItem = {
  cartId: number;
  userId: number;
  productId: number;
  colorId: number;
  sizeId: number;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  productName: string;
  productPrice: number;
  productThumbnail: string | null;
  colorName: string | null;
  colorCode: string | null;
  sizeLabel: string;
};

const API_BASE = 'http://127.0.0.1:4000';

const getStoredUser = (): StoredUser | null => {
  try {
    const raw = localStorage.getItem('attoUser');
    if (!raw) return null;
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
};

const getUserIdOrThrow = (): number => {
  const user = getStoredUser();
  if (!user?.userId) {
    throw new Error('로그인이 필요합니다.');
  }
  return user.userId;
};

export const getCartItems = async (): Promise<CartItem[]> => {
  const userId = getUserIdOrThrow();
  const response = await fetch(`${API_BASE}/api/users/${userId}/cart`);
  const result = await response.json();
  if (!response.ok || !result.ok) {
    throw new Error(result.message ?? '장바구니 조회 실패');
  }
  return Array.isArray(result.cartItems) ? result.cartItems : [];
};

export const addCartItem = async (params: {
  productId: number;
  colorId: number;
  sizeId: number;
  quantity?: number;
}): Promise<void> => {
  const userId = getUserIdOrThrow();
  const response = await fetch(`${API_BASE}/api/users/${userId}/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId: params.productId,
      colorId: params.colorId,
      sizeId: params.sizeId,
      quantity: params.quantity ?? 1,
    }),
  });
  const result = await response.json();
  if (!response.ok || !result.ok) {
    throw new Error([result.message, result.error].filter(Boolean).join(': ') || '장바구니 추가 실패');
  }
};

export const updateCartItemQuantity = async (cartId: number, quantity: number): Promise<void> => {
  const userId = getUserIdOrThrow();
  const response = await fetch(`${API_BASE}/api/users/${userId}/cart/${cartId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  });
  const result = await response.json();
  if (!response.ok || !result.ok) {
    throw new Error(result.message ?? '수량 변경 실패');
  }
};

export const removeCartItem = async (cartId: number): Promise<void> => {
  const userId = getUserIdOrThrow();
  const response = await fetch(`${API_BASE}/api/users/${userId}/cart/${cartId}`, {
    method: 'DELETE',
  });
  const result = await response.json();
  if (!response.ok || !result.ok) {
    throw new Error(result.message ?? '장바구니 삭제 실패');
  }
};

