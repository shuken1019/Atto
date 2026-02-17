import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import ProductSection from '../components/product/ProductSection';
import { getProducts } from '../services/productService';
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

  const liveProducts = products.filter((p) => p.isLive);
  const bestSellers = products;
  const newArrivals = products.filter((p) => p.isNew);
  const mainText = bannerSettings?.mainText?.trim() || 'ESSENTIALS';
  const seasonText = bannerSettings?.seasonText?.trim() || '';
  const hasCustomImage = Boolean(bannerSettings?.imageDataUrl);

  return (
    <HomePageContainer>
      <MainBanner>
        {hasCustomImage ? (
          <img src={bannerSettings?.imageDataUrl} alt="main banner" />
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

      <ContentContainer>
        {liveProducts.length > 0 && (
          <ProductSection
            title={
              <LiveTitle>
                Live
                <LiveDot aria-hidden="true" />
              </LiveTitle>
            }
            products={liveProducts}
          />
        )}
        <ProductSection title="Best Sellers" products={bestSellers} />
        <ProductSection title="New Arrivals" products={newArrivals} />
      </ContentContainer>
    </HomePageContainer>
  );
};

export default Home;

const HomePageContainer = styled.div``;

const MainBanner = styled.div`
  position: relative;
  width: 100%;
  margin-bottom: 60px;

  img {
    width: 100%;
    height: auto;
    display: block;
    max-height: 600px;
    object-fit: cover;
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
  padding: 0 24px;

  @media (max-width: 640px) {
    padding: 0 14px;
  }
`;

const LiveTitle = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const LiveDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #cf1f1f;
`;
