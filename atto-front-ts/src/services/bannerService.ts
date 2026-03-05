import { API_BASE_URL } from '../config/api';
import { authFetch } from '../utils/authFetch';

export type BannerSettings = {
  mainText: string;
  seasonText: string;
  imageUrl: string;
};

const DEFAULT_BANNER: BannerSettings = {
  mainText: 'ESSENTIALS',
  seasonText: 'SPRING / SUMMER 2024',
  imageUrl: '',
};

export const getBanner = async (): Promise<BannerSettings> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/banner`);
    const result = await response.json();
    if (!response.ok || !result?.ok || !result.banner) {
      return DEFAULT_BANNER;
    }
    return {
      ...DEFAULT_BANNER,
      ...result.banner,
      mainText: String(result.banner.mainText ?? DEFAULT_BANNER.mainText),
      seasonText: String(result.banner.seasonText ?? DEFAULT_BANNER.seasonText),
      imageUrl: String(result.banner.imageUrl ?? ''),
    };
  } catch (_error) {
    return DEFAULT_BANNER;
  }
};

type SaveBannerPayload = {
  mainText: string;
  seasonText: string;
  imageDataUrl?: string;
  imageName?: string;
  imageUrl?: string;
};

export const saveBanner = async (payload: SaveBannerPayload): Promise<BannerSettings> => {
  const response = await authFetch(`${API_BASE_URL}/api/banner`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  if (!response.ok || !result?.ok || !result.banner) {
    throw new Error(result?.message ?? 'banner save failed');
  }

  return {
    ...DEFAULT_BANNER,
    ...result.banner,
    mainText: String(result.banner.mainText ?? DEFAULT_BANNER.mainText),
    seasonText: String(result.banner.seasonText ?? DEFAULT_BANNER.seasonText),
    imageUrl: String(result.banner.imageUrl ?? ''),
  };
};
