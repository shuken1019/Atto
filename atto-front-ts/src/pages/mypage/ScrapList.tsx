import React from 'react';
import styled from 'styled-components';
import ProductCard from '../../components/product/ProductCard';
import { mockProducts } from '../../mocks/product'; // 가짜 데이터 활용

const ScrapList: React.FC = () => {
  // 임시로 가짜 데이터 중 2개만 스크랩했다고 가정
  const scrapItems = mockProducts.slice(0, 2);

  return (
    <Container>
      <Title>My Scraps ({scrapItems.length})</Title>
      <Grid>
        {scrapItems.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </Grid>
    </Container>
  );
};

export default ScrapList;

const Container = styled.div` width: 100%; `;
const Title = styled.h2` font-size: 24px; font-family: 'Playfair Display', serif; margin-bottom: 30px; border-bottom: 1px solid #ddd; padding-bottom: 15px; `;
const Grid = styled.div` display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; @media (max-width: 768px) { grid-template-columns: repeat(2, 1fr); } `;