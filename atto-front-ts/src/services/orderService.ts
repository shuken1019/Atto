type StoredUser = {
  userId: number;
  name?: string;
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

const getDefaultAddressId = async (userId: number): Promise<number | null> => {
  const response = await fetch(`${API_BASE}/api/users/${userId}/addresses`);
  const result = await response.json();
  if (!response.ok || !result.ok) {
    return null;
  }
  const addresses = Array.isArray(result.addresses) ? result.addresses : [];
  if (addresses.length === 0) return null;
  const first = addresses[0];
  const addressId = Number(first.addressId ?? 0);
  return Number.isInteger(addressId) && addressId > 0 ? addressId : null;
};

export const createPendingOrder = async (params: { totalAmount: number; memo?: string }): Promise<{ orderId: number; orderNo: string }> => {
  const userId = getUserIdOrThrow();
  const amount = Number(params.totalAmount);
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error('주문 금액이 올바르지 않습니다.');
  }

  const addressId = await getDefaultAddressId(userId);
  const user = getStoredUser();

  const paymentResponse = await fetch(`${API_BASE}/api/users/${userId}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount,
      paymentMethod: 'BANK_TRANSFER',
      depositorName: user?.name ?? null,
      bankName: '입금대기',
      memo: params.memo ?? null,
    }),
  });
  const paymentResult = await paymentResponse.json();
  if (!paymentResponse.ok || !paymentResult.ok) {
    throw new Error(paymentResult.message ?? '결제 생성 실패');
  }

  const paymentId = Number(paymentResult.paymentId);
  if (!Number.isInteger(paymentId) || paymentId <= 0) {
    throw new Error('paymentId 생성 실패');
  }

  const orderResponse = await fetch(`${API_BASE}/api/users/${userId}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentId,
      addressId,
      totalAmount: amount,
    }),
  });
  const orderResult = await orderResponse.json();
  if (!orderResponse.ok || !orderResult.ok) {
    throw new Error(orderResult.message ?? '주문 생성 실패');
  }

  const orderId = Number(orderResult.orderId);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new Error('orderId 생성 실패');
  }

  const orderNo = String(orderResult.orderNo ?? '');
  return { orderId, orderNo: orderNo || String(orderId) };
};
