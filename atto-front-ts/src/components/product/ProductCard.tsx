import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import type { IProduct } from '../../types/product';
import { ProductImageSVG } from '../../components/common/Placeholders';
import { addScrap } from '../../services/scrapService';

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

interface Props {
  product: IProduct;
  initialScrapped?: boolean;
}

const ProductCard: React.FC<Props> = ({ product, initialScrapped = false }) => {
  const navigate = useNavigate();
  const [savingScrap, setSavingScrap] = useState(false);
  const [scrapped, setScrapped] = useState(initialScrapped);

  const goToDetail = () => {
    navigate(`/product/${product.id}`);
  };

  const isRealImage =
    product.thumbnailImage &&
    product.thumbnailImage.startsWith('http') &&
    !product.thumbnailImage.includes('via.placeholder');

  const handleScrap = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (savingScrap) return;

    setSavingScrap(true);
    try {
      await addScrap(product.id);
      setScrapped(true);
      alert('스크랩 되었습니다.');
    } catch (error) {
      alert(error instanceof Error ? error.message : '스크랩 추가에 실패했습니다.');
    } finally {
      setSavingScrap(false);
    }
  };

  return (
    <Card onClick={goToDetail}>
      <ImageWrapper>
        {isRealImage ? <img src={product.thumbnailImage} alt={product.name} /> : <ProductImageSVG type={product.category} />}
      </ImageWrapper>

      <Info>
        <div>
          <Name>{product.name}</Name>
          <Price>{product.price.toLocaleString()}원</Price>
        </div>
        <LikeButton type="button" onClick={handleScrap} disabled={savingScrap} aria-label="scrap">
          <HeartIcon filled={scrapped} />
        </LikeButton>
      </Info>
    </Card>
  );
};

export default ProductCard;

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
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background-color: #f0f0f0;
  position: relative;

  img,
  svg {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
    display: block;
  }

  &:hover img,
  &:hover svg {
    transform: scale(1.03);
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
  color: #1a1a1a;

  @media (max-width: 640px) {
    font-size: 13px;
  }
`;

const LikeButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  color: #333;
  opacity: 0.7;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    opacity: 1;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;
