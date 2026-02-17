import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
import type { IProduct } from '../../types/product';

interface ProductSectionProps {
  title: React.ReactNode;
  products: IProduct[];
  seeAllLink?: string;
}

const ProductSection: React.FC<ProductSectionProps> = ({ title, products, seeAllLink = '/shop' }) => {
  return (
    <SectionContainer>
      <SectionHeader>
        <Title>{title}</Title>
        <StyledLink to={seeAllLink}>See All</StyledLink>
      </SectionHeader>
      <ProductGrid>
        {products.slice(0, 3).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ProductGrid>
    </SectionContainer>
  );
};

export default ProductSection;

const SectionContainer = styled.section`
  margin-bottom: 80px;

  @media (max-width: 640px) {
    margin-bottom: 52px;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  @media (max-width: 640px) {
    margin-bottom: 16px;
  }
`;

const Title = styled.h2`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 28px;
  font-weight: 400;
  color: #1a1a1a;
  font-family: serif;

  @media (max-width: 640px) {
    font-size: 24px;
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

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px 14px;
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;
