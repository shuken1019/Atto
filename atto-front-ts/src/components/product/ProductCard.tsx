// src/components/product/ProductCard.tsx

import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom'; 
import type { IProduct } from '../../types/product';
// 1. 여기서 가져왔으면...
import { ProductImageSVG } from '../../components/common/Placeholders';

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
);

interface Props {
  product: IProduct;
  initialScrapped?: boolean;
}

const ProductCard: React.FC<Props> = ({ product, initialScrapped = false }) => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(initialScrapped);

  const goToDetail = () => {
    navigate(`/product/${product.id}`);
  };

  const representativeImages = useMemo(() => {
    if (product.representativeImages.length > 0) return product.representativeImages;
    return [product.thumbnailImage];
  }, [product.representativeImages, product.thumbnailImage]);

  const currentImage = representativeImages[currentImageIndex] || product.thumbnailImage;
  const isRealImage =
    currentImage &&
    currentImage.startsWith('http') &&
    !currentImage.includes('via.placeholder');

  useEffect(() => {
    if (!isHovered || representativeImages.length <= 1) return;

    const timer = window.setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % representativeImages.length);
    }, 900);

    return () => window.clearInterval(timer);
  }, [isHovered, representativeImages.length]);

  const handleMouseEnter = () => {
    if (representativeImages.length <= 1) return;
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setCurrentImageIndex(0);
  };

  return (
     <Card onClick={goToDetail} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <ImageWrapper>
        {isRealImage ? (
          <img src={currentImage} alt={product.name} />
        ) : (
          <ProductImageSVG type={product.category} />
        )}
      </ImageWrapper>
      
      <Info>
        <div>
          <Name>{product.name}</Name>
          <Price>₩{product.price.toLocaleString()}</Price>
        </div>
        <LikeButton
          type="button"
          $active={isLiked}
          onClick={(e) => {
            e.stopPropagation();
            setIsLiked((prev) => !prev);
          }}
          aria-label={isLiked ? '스크랩 해제' : '스크랩'}
        >
          <HeartIcon filled={isLiked} />
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

  @media (max-width: 640px) {
    gap: 10px;
  }
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

  @media (max-width: 640px) {
    font-size: 14px;
    margin-bottom: 2px;
  }
`;

const Price = styled.p`
  font-size: 14px;
  font-weight: 600;
  color: #1A1A1A;

  @media (max-width: 640px) {
    font-size: 13px;
  }
`;

const LikeButton = styled.button<{ $active?: boolean }>`
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  color: ${(props) => (props.$active ? '#ef4444' : '#333')};
  opacity: 0.7;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover { opacity: 1; }
`;
