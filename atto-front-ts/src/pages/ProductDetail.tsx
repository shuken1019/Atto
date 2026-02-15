import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useParams } from 'react-router-dom';
import { getProductById } from '../services/productService';
import type { IProduct } from '../types/product';
import { ProductImageSVG } from '../components/common/Placeholders';
import { addScrap, getScraps } from '../services/scrapService';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [scrapped, setScrapped] = useState(false);
  const [savingScrap, setSavingScrap] = useState(false);

  useEffect(() => {
    if (!id) return;

    getProductById(Number(id)).then((data) => {
      setProduct(data || null);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!product) return;

    getScraps()
      .then((items) => {
        setScrapped(items.some((item) => Number(item.productId) === product.id));
      })
      .catch(() => {
        // 비로그인 상태에서는 조회 실패가 정상일 수 있으므로 무시
      });
  }, [product]);

  if (loading) return <LoadingMsg>Loading...</LoadingMsg>;
  if (!product) return <LoadingMsg>Product not found.</LoadingMsg>;

  const isRealImage =
    product.thumbnailImage &&
    product.thumbnailImage.startsWith('http') &&
    !product.thumbnailImage.includes('via.placeholder');

  const colors = Array.from(new Set(product.variants.map((v) => v.color)));
  const sizes = Array.from(new Set(product.variants.flatMap((v) => v.sizes)));

  const handleAddToCart = () => {
    if (!selectedColor || (sizes.length > 0 && !selectedSize)) {
      alert('옵션을 선택해주세요.');
      return;
    }
    alert(`${product.name} (${selectedColor}, ${selectedSize ?? '-'}) 장바구니에 담겼습니다.`);
  };

  const handleAddScrap = async () => {
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
    <Container>
      <ImageSection>
        <ImageWrapper>
          {isRealImage ? <img src={product.thumbnailImage} alt={product.name} /> : <ProductImageSVG type={product.category} />}
        </ImageWrapper>
      </ImageSection>

      <InfoSection>
        <CategoryLabel>{product.category.toUpperCase()}</CategoryLabel>
        <ProductName>{product.name}</ProductName>
        <Price>{product.price.toLocaleString()}원</Price>

        <Description>
          {product.description}
          <br />
          자연스러운 실루엣과 편안한 착용감을 제공합니다.
        </Description>

        <Divider />

        <OptionsWrapper>
          {colors.length > 0 && (
            <OptionGroup>
              <OptionLabel>Color</OptionLabel>
              <ColorGrid>
                {colors.map((color) => {
                  const variant = product.variants.find((v) => v.color === color);
                  const colorCode = variant?.colorCode || '#ddd';

                  return (
                    <ColorButton
                      key={color}
                      colorCode={colorCode}
                      selected={selectedColor === color}
                      onClick={() => setSelectedColor(color)}
                      title={color}
                    />
                  );
                })}
              </ColorGrid>
              {selectedColor && <SelectedText>{selectedColor}</SelectedText>}
            </OptionGroup>
          )}

          {sizes.length > 0 && (
            <OptionGroup>
              <OptionLabel>Size</OptionLabel>
              <SizeGrid>
                {sizes.map((size) => (
                  <SizeButton key={size} selected={selectedSize === size} onClick={() => setSelectedSize(size)}>
                    {size}
                  </SizeButton>
                ))}
              </SizeGrid>
            </OptionGroup>
          )}
        </OptionsWrapper>

        <ButtonGroup>
          <AddToCartBtn onClick={handleAddToCart}>ADD TO CART</AddToCartBtn>
          <BuyNowBtn>BUY NOW</BuyNowBtn>
          <ScrapBtn type="button" onClick={handleAddScrap} scrapped={scrapped} disabled={savingScrap}>
            {scrapped ? 'SCRAPPED' : 'SCRAP'}
          </ScrapBtn>
        </ButtonGroup>

        <ExtraInfo>
          <p>Fabric: Linen 100% / Cotton 100%</p>
          <p>Care: Dry Clean Only</p>
        </ExtraInfo>
      </InfoSection>
    </Container>
  );
};

export default ProductDetail;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 20px;
  display: flex;
  gap: 80px;

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 26px 14px 60px;
    gap: 26px;
  }
`;

const ImageSection = styled.div`
  flex: 1;
`;

const ImageWrapper = styled.div`
  width: 100%;
  aspect-ratio: 3 / 4;
  background-color: #f0f0f0;
  overflow: hidden;

  img,
  svg {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const InfoSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;

  @media (max-width: 768px) {
    justify-content: flex-start;
  }
`;

const CategoryLabel = styled.span`
  font-size: 14px;
  color: #888;
  letter-spacing: 1px;
  margin-bottom: 10px;
  text-transform: uppercase;
`;

const ProductName = styled.h1`
  font-size: 32px;
  font-weight: 400;
  margin-bottom: 20px;
  font-family: 'Playfair Display', serif;
  color: #1a1a1a;

  @media (max-width: 768px) {
    font-size: 28px;
    margin-bottom: 14px;
  }
`;

const Price = styled.p`
  font-size: 20px;
  font-weight: 500;
  color: #333;
  margin-bottom: 30px;
  font-family: 'Noto Sans KR', sans-serif;

  @media (max-width: 768px) {
    margin-bottom: 18px;
  }
`;

const Description = styled.p`
  font-size: 15px;
  line-height: 1.8;
  color: #555;
  margin-bottom: 30px;

  @media (max-width: 768px) {
    font-size: 14px;
    line-height: 1.7;
    margin-bottom: 20px;
  }
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid #e0e0e0;
  margin-bottom: 30px;

  @media (max-width: 768px) {
    margin-bottom: 20px;
  }
`;

const OptionsWrapper = styled.div`
  margin-bottom: 40px;

  @media (max-width: 768px) {
    margin-bottom: 24px;
  }
`;

const OptionGroup = styled.div`
  margin-bottom: 24px;
`;

const OptionLabel = styled.p`
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
`;

const SelectedText = styled.span`
  font-size: 13px;
  color: #666;
  margin-top: 8px;
  display: block;
`;

const ColorGrid = styled.div`
  display: flex;
  gap: 12px;
`;

const ColorButton = styled.button<{ colorCode: string; selected: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${(props) => props.colorCode};
  border: 1px solid #ddd;
  cursor: pointer;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: -4px;
    left: -4px;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: 1px solid ${(props) => (props.selected ? '#333' : 'transparent')};
  }
`;

const SizeGrid = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const SizeButton = styled.button<{ selected: boolean }>`
  min-width: 48px;
  height: 48px;
  padding: 0 16px;
  border: 1px solid ${(props) => (props.selected ? '#333' : '#ddd')};
  background-color: ${(props) => (props.selected ? '#333' : 'transparent')};
  color: ${(props) => (props.selected ? '#fff' : '#333')};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #333;
  }

  @media (max-width: 768px) {
    min-width: 44px;
    height: 44px;
    padding: 0 12px;
    font-size: 13px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 40px;

  @media (max-width: 768px) {
    flex-direction: column;
    margin-bottom: 28px;
    gap: 10px;
  }
`;

const AddToCartBtn = styled.button`
  flex: 1;
  height: 56px;
  background-color: #333;
  color: #fff;
  border: none;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  letter-spacing: 1px;

  &:hover {
    background-color: #000;
  }

  @media (max-width: 768px) {
    height: 52px;
    font-size: 14px;
  }
`;

const BuyNowBtn = styled.button`
  flex: 1;
  height: 56px;
  background-color: #fff;
  color: #333;
  border: 1px solid #333;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  letter-spacing: 1px;

  &:hover {
    background-color: #f5f5f5;
  }

  @media (max-width: 768px) {
    height: 52px;
    font-size: 14px;
  }
`;

const ScrapBtn = styled.button<{ scrapped: boolean }>`
  flex: 1;
  height: 56px;
  background-color: ${(props) => (props.scrapped ? '#1a1a1a' : '#fff')};
  color: ${(props) => (props.scrapped ? '#fff' : '#333')};
  border: 1px solid ${(props) => (props.scrapped ? '#1a1a1a' : '#ddd')};
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  letter-spacing: 1px;

  &:hover {
    border-color: #333;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const ExtraInfo = styled.div`
  font-size: 13px;
  color: #888;
  line-height: 1.6;
`;

const LoadingMsg = styled.div`
  text-align: center;
  padding: 100px;
  font-size: 18px;
  color: #888;
`;
