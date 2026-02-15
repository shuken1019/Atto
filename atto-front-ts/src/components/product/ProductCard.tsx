// src/components/product/ProductCard.tsx

import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom'; 
import type { IProduct } from '../../types/product';
// 1. 여기서 가져왔으면...
import { ProductImageSVG } from '../../components/common/Placeholders';

const HeartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
);

interface Props {
  product: IProduct;
}

const ProductCard: React.FC<Props> = ({ product }) => {
  const navigate = useNavigate();
  const goToDetail = () => {
    navigate(`/product/${product.id}`);
  };
  // 이미지가 진짜인지(http로 시작하고 placeholder가 아닌지) 확인
  const isRealImage = product.thumbnailImage && 
                      product.thumbnailImage.startsWith('http') && 
                      !product.thumbnailImage.includes('via.placeholder');

  return (
     <Card onClick={goToDetail}>
      <ImageWrapper>
        {/* 2. ⭐️ 여기서 꼭 사용해줘야 에러가 안 납니다! */}
        {isRealImage ? (
          <img src={product.thumbnailImage} alt={product.name} />
        ) : (
          /* 이미지가 없으면 우리가 만든 예쁜 SVG 그림 보여주기 */
          <ProductImageSVG type={product.category} />
        )}
      </ImageWrapper>
      
      <Info>
        <div>
          <Name>{product.name}</Name>
          <Price>₩{product.price.toLocaleString()}</Price>
        </div>
        <LikeButton onClick={(e) => e.stopPropagation()}> {/* 하트 누를땐 이동 안 하게 막음 */}
          <HeartIcon />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>

        </LikeButton>
      </Info>
    </Card>
  );
};

export default ProductCard;

// ---------- Styled Components ----------

const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: pointer;
`;

const ImageWrapper = styled.div`
  width: 100%;
  aspect-ratio: 3 / 4; /* 세로로 긴 비율 */
  overflow: hidden;
  background-color: #f0f0f0; /* 로딩 전 배경색 */
  position: relative;
  
  img, svg {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
    display: block;
  }
  
  &:hover img, &:hover svg {
    transform: scale(1.03); /* 마우스 올리면 살짝 확대 */
  }
`;

const Info = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const Name = styled.h3`
  font-size: 15px;
  font-weight: 400;
  margin-bottom: 4px;
  font-family: 'Noto Sans KR', sans-serif;
  color: #333;
`;

const Price = styled.p`
  font-size: 14px;
  font-weight: 600;
  color: #1A1A1A;
`;

const LikeButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: #333;
  opacity: 0.7;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover { opacity: 1; }
`;