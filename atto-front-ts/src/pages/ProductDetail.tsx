// src/pages/ProductDetail.tsx

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useParams } from 'react-router-dom';
import { getProductById } from '../services/productService';
import type { IProduct } from '../types/product';
import { ProductImageSVG } from '../components/common/Placeholders';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // URL에서 id 가져오기
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);

  // 옵션 상태 관리
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      getProductById(Number(id)).then((data) => {
        setProduct(data || null);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) return <LoadingMsg>Loading...</LoadingMsg>;
  if (!product) return <LoadingMsg>Product not found.</LoadingMsg>;

  // 이미지 처리 로직
  const mainImage = product.representativeImages[0] || product.thumbnailImage;
  const isRealImage =
    mainImage &&
    mainImage.startsWith('http') &&
    !mainImage.includes('via.placeholder');

  // 상품 데이터에서 가능한 옵션 추출 (중복 제거)
  const colors = Array.from(new Set(product.variants.map(v => v.color)));
  const sizes = Array.from(new Set(product.variants.flatMap(v => v.sizes)));

  // 장바구니 담기 핸들러
  const handleAddToCart = () => {
    if (!selectedColor || (sizes.length > 0 && !selectedSize)) {
      alert('옵션을 선택해주세요.');
      return;
    }
    alert(`${product.name} (${selectedColor}, ${selectedSize}) 장바구니에 담겼습니다!`);
  };

  return (
    <PageWrapper>
      <Container>
        <ImageSection>
          <ImageWrapper>
            {isRealImage ? (
              <img src={mainImage} alt={product.name} />
            ) : (
              <ProductImageSVG type={product.category} />
            )}
          </ImageWrapper>
        </ImageSection>

        <InfoSection>
          <CategoryLabel>{product.category.toUpperCase()}</CategoryLabel>
          <ProductName>{product.name}</ProductName>
          <Price>₩{product.price.toLocaleString()}</Price>

          <Description>
            {product.description}
            <br />
            자연스러운 실루엣과 편안한 착용감을 제공합니다.
            일상 속에서 가장 손이 많이 가는 아이템이 될 것입니다.
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
            <AddToCartBtn onClick={handleAddToCart}>
              ADD TO CART
            </AddToCartBtn>
            <BuyNowBtn>BUY NOW</BuyNowBtn>
          </ButtonGroup>

          <ExtraInfo>
            <p>Fabric: Linen 100% / Cotton 100%</p>
            <p>Care: Dry Clean Only</p>
          </ExtraInfo>
        </InfoSection>
      </Container>

      <DetailSection>
        <DetailTitle>추가 이미지 / 동영상</DetailTitle>
        <MediaGrid>
          {product.detailMedia.map((media, index) => (
            <MediaCard key={`${media.url}-${index}`}>
              {media.type === 'video' ? (
                <video controls playsInline preload="metadata">
                  <source src={media.url} />
                </video>
              ) : (
                <img src={media.url} alt={`${product.name} 상세 이미지 ${index + 1}`} />
              )}
            </MediaCard>
          ))}
        </MediaGrid>
      </DetailSection>

      <DetailSection>
        <DetailTitle>상세 설명</DetailTitle>
        <DetailParagraph>{product.detailDescription}</DetailParagraph>
      </DetailSection>

      <DetailSection>
        <DetailTitle>사이즈 표</DetailTitle>
        <SizeTable>
          <thead>
            <tr>
              <th>사이즈</th>
              <th>어깨</th>
              <th>가슴</th>
              <th>총장</th>
            </tr>
          </thead>
          <tbody>
            {product.sizeGuide.map((sizeRow) => (
              <tr key={sizeRow.label}>
                <td>{sizeRow.label}</td>
                <td>{sizeRow.shoulder}</td>
                <td>{sizeRow.chest}</td>
                <td>{sizeRow.length}</td>
              </tr>
            ))}
          </tbody>
        </SizeTable>
      </DetailSection>

      <DetailSection>
        <DetailTitle>상품 주요 정보</DetailTitle>
        <KeyInfoList>
          {product.keyInfo.map((info) => (
            <li key={info}>{info}</li>
          ))}
        </KeyInfoList>
      </DetailSection>
    </PageWrapper>
  );
};

export default ProductDetail;

// ---------- Styled Components ----------

const PageWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Container = styled.div`
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

  img, svg {
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
  background-color: ${props => props.colorCode};
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
    border: 1px solid ${props => props.selected ? '#333' : 'transparent'};
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
  border: 1px solid ${props => props.selected ? '#333' : '#ddd'};
  background-color: ${props => props.selected ? '#333' : 'transparent'};
  color: ${props => props.selected ? '#fff' : '#333'};
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
  transition: background-color 0.2s;

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
  transition: background-color 0.2s;

  &:hover {
    background-color: #f5f5f5;
  }

  @media (max-width: 768px) {
    height: 52px;
    font-size: 14px;
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

const DetailSection = styled.section`
  margin: 0 20px 20px;
  padding: 24px;
  background: #fff;
  border: 1px solid #ece7de;

  @media (max-width: 768px) {
    margin: 0 14px 14px;
    padding: 16px;
  }
`;

const DetailTitle = styled.h3`
  font-size: 18px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 500;
  margin-bottom: 14px;
`;

const MediaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const MediaCard = styled.div`
  width: 100%;
  aspect-ratio: 3 / 4;
  background: #f4f4f4;
  overflow: hidden;

  img,
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const DetailParagraph = styled.p`
  font-size: 14px;
  line-height: 1.8;
  color: #555;
  white-space: pre-wrap;
`;

const SizeTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    border-bottom: 1px solid #eee;
    padding: 10px;
    text-align: center;
    font-size: 13px;
  }

  th {
    background: #fafafa;
    font-weight: 600;
  }
`;

const KeyInfoList = styled.ul`
  list-style: disc;
  padding-left: 20px;
  color: #444;

  li {
    font-size: 14px;
    line-height: 1.8;
  }
`;
