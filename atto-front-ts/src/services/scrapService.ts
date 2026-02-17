type StoredUser = {
  userId: number;
};
import { API_BASE_URL } from '../config/api';

type ScrapItem = {
  scrapId: number;
  userId: number;
  productId: number;
  created_at: string;
};

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

export const getScraps = async (): Promise<ScrapItem[]> => {
  const userId = getUserIdOrThrow();
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}/scraps`);
  const result = await response.json();
  if (!response.ok || !result.ok) {
    throw new Error(result.message ?? '스크랩 목록 조회 실패');
  }
  return Array.isArray(result.scraps) ? result.scraps : [];
};

export const addScrap = async (productId: number): Promise<boolean> => {
  const userId = getUserIdOrThrow();
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}/scraps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId }),
  });

  const result = await response.json();

  // 이미 스크랩된 경우는 실패가 아니라 "이미 활성화됨"으로 취급
  if (response.status === 409) {
    return false;
  }

  if (!response.ok || !result.ok) {
    throw new Error([result.message, result.error].filter(Boolean).join(': ') || '스크랩 추가 실패');
  }

  return true;
};

export const removeScrap = async (productId: number): Promise<void> => {
  const userId = getUserIdOrThrow();
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}/scraps/${productId}`, {
    method: 'DELETE',
  });
  const result = await response.json();
  if (!response.ok || !result.ok) {
    throw new Error(result.message ?? '스크랩 삭제 실패');
  }
};
