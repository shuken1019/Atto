// src/components/product/ProductSection.tsx

import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
// ⭐️중요⭐️: 반드시 이 경로의 진짜 IProduct를 사용해야 합니다.
import type{ IProduct } from '../../types/product';

// 🚨🚨🚨 여기에 interface IProduct { ... } 같은 코드가 있었다면 절대 안 됩니다! 삭제되었습니다. 🚨🚨🚨

interface ProductSectionProps {
  title: string;
  // 이제 여기의 IProduct는 진짜(types/product.ts)를 의미합니다.
  products: IProduct[]; 
  seeAllLink?: string;
}

const ProductSection: React.FC<ProductSectionProps> = ({ title, products, seeAllLink = '/shop' }) => {
  return (
    <SectionContainer>
      <SectionHeader>
        <h2>{title}</h2>
        <StyledLink to={seeAllLink}>See All</StyledLink>
      </SectionHeader>
      <ProductGrid>
        {/* 앞에서부터 3개만 잘라서 보여줍니다. */}
        {products.slice(0, 3).map((product) => (
          /* 이제 product.id가 숫자이므로 ProductCard가 기쁘게 받아들입니다. */
          <ProductCard key={product.id} product={product} />
        ))}
      </ProductGrid>
    </SectionContainer>
  );
};

export default ProductSection;

// ---------- Styled Components 정의 ----------

const SectionContainer = styled.section`
  margin-bottom: 80px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  h2 {
    font-size: 28px;
    font-weight: 400;
    color: #1a1a1a;
    font-family: serif;
  }
`;

const StyledLink = styled(Link)`
  font-size: 14px;
  color: #555;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s;

  &:hover {
    border-bottom-color: #555;
  }
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;