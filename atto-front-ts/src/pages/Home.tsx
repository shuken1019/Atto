// src/pages/Home.tsx

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import ProductSection from '../components/product/ProductSection';
import { getProducts } from '../services/productService';
// ⭐️ 타입 import 시 type 키워드 사용
import type { IProduct } from '../types/product'; 
import { MainBannerSVG } from '../components/common/Placeholders';
const Home: React.FC = () => {
  const [products, setProducts] = useState<IProduct[]>([]);

  useEffect(() => {
    // 상품 데이터를 가져옵니다.
    getProducts().then((data) => setProducts(data));
  }, []);

  // 데이터를 용도에 맞게 필터링
  const bestSellers = products;
  const newArrivals = products.filter(p => p.isNew);
  const collections = products;

  return (
    <HomePageContainer>
      {/* 메인 배너 섹션 */}
      <MainBanner>
        {/* ⭐️ 2. img 태그 대신 컴포넌트 사용 */}
        <MainBannerSVG />
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
  width: 100%;
  margin-bottom: 60px;
  
  img {
    width: 100%;
    height: auto;
    display: block;
    max-height: 600px; /* 배너 높이 제한 */
    object-fit: cover; /* 비율 유지하며 꽉 채우기 */
  }
`;

const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px; /* 좌우 여백 */
`;