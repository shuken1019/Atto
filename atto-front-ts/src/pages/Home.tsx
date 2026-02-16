// src/pages/Home.tsx

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import ProductSection from '../components/product/ProductSection';
import { getProducts } from '../services/productService';
// ⭐️ 타입 import 시 type 키워드 사용
import type { IProduct } from '../types/product'; 
import { MainBannerSVG } from '../components/common/Placeholders';

const BANNER_STORAGE_KEY = 'atto_banner_settings';

type BannerSettings = {
  mainText: string;
  seasonText: string;
  imageDataUrl: string;
};

const Home: React.FC = () => {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [bannerSettings, setBannerSettings] = useState<BannerSettings | null>(null);

  useEffect(() => {
    // 상품 데이터를 가져옵니다.
    getProducts().then((data) => setProducts(data));
  }, []);

  useEffect(() => {
    const loadBanner = () => {
      const raw = localStorage.getItem(BANNER_STORAGE_KEY);
      if (!raw) {
        setBannerSettings(null);
        return;
      }

      try {
        const parsed = JSON.parse(raw) as Partial<BannerSettings>;
        setBannerSettings({
          mainText: parsed.mainText ?? 'ESSENTIALS',
          seasonText: parsed.seasonText ?? '',
          imageDataUrl: parsed.imageDataUrl ?? '',
        });
      } catch {
        setBannerSettings(null);
      }
    };

    loadBanner();
    window.addEventListener('banner-updated', loadBanner);
    window.addEventListener('storage', loadBanner);

    return () => {
      window.removeEventListener('banner-updated', loadBanner);
      window.removeEventListener('storage', loadBanner);
    };
  }, []);

  // 데이터를 용도에 맞게 필터링
  const bestSellers = products;
  const newArrivals = products.filter(p => p.isNew);
  const collections = products;
  const mainText = bannerSettings?.mainText?.trim() || 'ESSENTIALS';
  const seasonText = bannerSettings?.seasonText?.trim() || '';
  const hasCustomImage = Boolean(bannerSettings?.imageDataUrl);

  return (
    <HomePageContainer>
      {/* 메인 배너 섹션 */}
      <MainBanner>
        {hasCustomImage ? (
          <img src={bannerSettings?.imageDataUrl} alt="메인 배너" />
        ) : (
          <MainBannerSVG />
        )}
        {hasCustomImage && (
          <BannerOverlay>
            <h2>{mainText}</h2>
            {seasonText.length > 0 && <p>{seasonText}</p>}
          </BannerOverlay>
        )}
      </MainBanner>

      {/* 컨텐츠 영역 */}
      <ContentContainer>
        <ProductSection title="Best Sellers" products={bestSellers} />
        <ProductSection title="New Arrivals" products={newArrivals} />
        <ProductSection title="Collections" products={collections} />
      </ContentContainer>
    </HomePageContainer>
  );
};

export default Home;

// 👇👇👇 이 아래 부분(스타일 정의)이 빠져서 에러가 났던 것입니다! 👇👇👇

// ---------- Styled Components 정의 ----------

const HomePageContainer = styled.div`
  /* 배경색은 Layout이나 GlobalStyle에서 처리하므로 투명하게 둬도 됩니다 */
`;

const MainBanner = styled.div`
  position: relative;
  width: 100%;
  margin-bottom: 60px;
  
  img {
    width: 100%;
    height: auto;
    display: block;
    max-height: 600px; /* 배너 높이 제한 */
    object-fit: cover; /* 비율 유지하며 꽉 채우기 */
  }

  @media (max-width: 640px) {
    margin-bottom: 36px;
  }
`;

const BannerOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #fff;
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.38);

  h2 {
    font-family: 'Playfair Display', serif;
    font-size: 80px;
    letter-spacing: 8px;
    line-height: 1.1;
  }

  p {
    margin-top: 8px;
    font-size: 24px;
    letter-spacing: 3px;
  }

  @media (max-width: 768px) {
    h2 {
      font-size: 44px;
      letter-spacing: 4px;
    }

    p {
      font-size: 16px;
      letter-spacing: 2px;
    }
  }
`;

const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px; /* 좌우 여백 */

  @media (max-width: 640px) {
    padding: 0 14px;
  }
`;
