// src/pages/ProductDetail.tsx

import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useNavigate, useParams } from 'react-router-dom';
import { getProductById } from '../services/productService';
import { addScrap, getScraps, removeScrap } from '../services/scrapService';
import { addCartItem } from '../services/cartService';
import type { IProduct } from '../types/product';
import { ProductImageSVG } from '../components/common/Placeholders';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // URL?먯꽌 id 媛?몄삤湲?
  const navigate = useNavigate();
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);

  // ?듭뀡 ?곹깭 愿由?
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isScrapped, setIsScrapped] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [scrapPending, setScrapPending] = useState(false);
  const variants = useMemo(() => product?.variants ?? [], [product?.variants]);
  const sizeLabelToId = (size: string): number => {
    if (size === 'S') return 1;
    if (size === 'M') return 2;
    if (size === 'L') return 3;
    if (size.startsWith('SIZE-')) {
      const parsed = Number(size.replace('SIZE-', ''));
      return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
    }
    return 0;
  };

  useEffect(() => {
    if (id) {
      getProductById(Number(id)).then((data) => {
        setProduct(data || null);
        setLoading(false);
      });
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const loadScrapState = async () => {
      try {
        const scraps = await getScraps();
        setIsScrapped(scraps.some((item) => Number(item.productId) === Number(id)));
      } catch {
        setIsScrapped(false);
      }
    };
    loadScrapState();
  }, [id]);

  const colors = useMemo(() => Array.from(new Set(variants.map((v) => v.color))), [variants]);
  const sizes = useMemo(() => {
    const raw = Array.from(new Set(variants.flatMap((v) => v.sizes)));
    const order = new Map<string, number>([
      ['S', 1],
      ['M', 2],
      ['L', 3],
    ]);
    return raw.sort((a, b) => (order.get(a) ?? 99) - (order.get(b) ?? 99) || a.localeCompare(b));
  }, [variants]);

  const isColorBlocked = (color: string): boolean => {
    if (!selectedSize) return false;
    const variant = variants.find((v) => v.color === color);
    return !variant?.sizes.includes(selectedSize);
  };

  useEffect(() => {
    if (!selectedColor) return;

    const selectedVariant = variants.find((v) => v.color === selectedColor);
    const blocked = Boolean(selectedSize && !selectedVariant?.sizes.includes(selectedSize));
    if (blocked) {
      setSelectedColor(null);
    }
  }, [selectedSize, selectedColor, variants]);

  if (loading) return <LoadingMsg>Loading...</LoadingMsg>;
  if (!product) return <LoadingMsg>Product not found.</LoadingMsg>;

  // ?대?吏 泥섎━ 濡쒖쭅
  const mainImage = product.representativeImages[0] || product.thumbnailImage;
  const isRealImage =
    mainImage &&
    mainImage.startsWith('http') &&
    !mainImage.includes('via.placeholder');

  // ?λ컮援щ땲 ?닿린 ?몃뱾??
  const handleAddToCart = () => {
    if (!product) return;
    if (!selectedColor || (sizes.length > 0 && !selectedSize)) {
      alert('옵션을 선택해주세요.');
      return;
    }
    const selectedVariant = variants.find((v) => v.color === selectedColor);
    const colorId = Number(selectedVariant?.colorId ?? 0);
    const sizeId = Number(selectedSize ? sizeLabelToId(selectedSize) : 0);

    if (!Number.isInteger(colorId) || colorId <= 0 || !Number.isInteger(sizeId) || sizeId <= 0) {
      alert('옵션 정보가 올바르지 않습니다.');
      return;
    }

    const run = async () => {
      try {
        await addCartItem({
          productId: product.id,
          colorId,
          sizeId,
          quantity: 1,
        });
        setIsCartModalOpen(true);
      } catch (error) {
        const message = error instanceof Error ? error.message : '장바구니 추가에 실패했습니다.';
        alert(message);
      }
    };
    run();
  };

  const shareUrl = window.location.href;

  const handleCopyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('링크가 복사되었습니다.');
    } catch {
      alert('복사에 실패했습니다.');
    }
  };

  const openShareWindow = (type: 'line' | 'band' | 'naver' | 'facebook' | 'x') => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(product.name);
    const map: Record<typeof type, string> = {
      line: `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`,
      band: `https://band.us/plugin/share?body=${encodedTitle}%20${encodedUrl}&route=${encodedUrl}`,
      naver: `https://share.naver.com/web/shareView?url=${encodedUrl}&title=${encodedTitle}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      x: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    };

    window.open(map[type], '_blank', 'width=720,height=760');
  };

  const handleScrap = () => {
    if (!product || scrapPending) return;
    const run = async () => {
      setScrapPending(true);
      try {
        if (isScrapped) {
          await removeScrap(product.id);
          setIsScrapped(false);
        } else {
          await addScrap(product.id);
          setIsScrapped(true);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : '스크랩 처리에 실패했습니다.';
        alert(message);
      } finally {
        setScrapPending(false);
      }
    };
    run();
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
          <NameRow>
            <ProductName>{product.name}</ProductName>
            <ShareBtn type="button" onClick={() => setIsShareOpen(true)} aria-label="공유하기">
              <ShareIcon viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="18" cy="5" r="2.6" />
                <circle cx="6" cy="12" r="2.6" />
                <circle cx="18" cy="19" r="2.6" />
                <path d="M8.2 10.9L15.8 6.1M8.2 13.1l7.6 4.8" />
              </ShareIcon>
            </ShareBtn>
          </NameRow>
          <Price>₩{product.price.toLocaleString()}</Price>

          <Description>{product.description}</Description>

          <Divider />

          <OptionsWrapper>
            {sizes.length > 0 && (
              <OptionGroup>
                <OptionLabel>Size</OptionLabel>
                <SizeGrid>
                  {sizes.map((size) => (
                    <SizeButton key={size} $selected={selectedSize === size} onClick={() => setSelectedSize(size)}>
                      {size}
                    </SizeButton>
                  ))}
                </SizeGrid>
              </OptionGroup>
            )}

            {colors.length > 0 && (
              <OptionGroup>
                <OptionLabel>Color</OptionLabel>
                <ColorGrid>
                  {colors.map((color) => {
                    const variant = product.variants.find((v) => v.color === color);
                    const colorCode = variant?.colorCode || '#ddd';
                    const blocked = isColorBlocked(color);

                    return (
                      <ColorButton
                        key={color}
                        $colorCode={colorCode}
                        $selected={selectedColor === color}
                        $blocked={blocked}
                        disabled={blocked}
                        onClick={() => {
                          if (!blocked) setSelectedColor(color);
                        }}
                        title={blocked ? `${color} (선택 불가)` : color}
                      />
                    );
                  })}
                </ColorGrid>
                {selectedSize && <SelectedText>선택 사이즈: {selectedSize}</SelectedText>}
                {selectedColor && <SelectedText>{selectedColor}</SelectedText>}
              </OptionGroup>
            )}
          </OptionsWrapper>

          <ButtonGroup>
            <AddToCartBtn type="button">바로구매</AddToCartBtn>
            <BuyNowBtn type="button" onClick={handleAddToCart}>장바구니</BuyNowBtn>
            <ScrapBtn type="button" $active={isScrapped} onClick={handleScrap} disabled={scrapPending}>
              <HeartIcon viewBox="0 0 24 24" fill={isScrapped ? '#ef4444' : 'none'} stroke={isScrapped ? '#ef4444' : 'currentColor'} strokeWidth="1.9">
                <path d="M12 20.5S4 15.2 4 9.4A4.4 4.4 0 0 1 8.4 5c1.5 0 2.9.7 3.6 1.8A4.4 4.4 0 0 1 15.6 5 4.4 4.4 0 0 1 20 9.4c0 5.8-8 11.1-8 11.1Z" />
              </HeartIcon>
            </ScrapBtn>
          </ButtonGroup>

          <ExtraInfo>
            <p>Fabric: Linen 100% / Cotton 100%</p>
            <p>Care: Dry Clean Only</p>
          </ExtraInfo>
        </InfoSection>
      </Container>

      <DetailSection>
        <DetailTitle>상세 콘텐츠</DetailTitle>
        <DetailContentFlow>
          <DetailParagraph>{product.detailDescription}</DetailParagraph>
          {product.detailMedia.map((media, index) => (
            <MediaCard key={`${media.url}-${index}`}>
              {media.type === 'video' ? (
                <video controls playsInline preload="metadata">
                  <source src={media.url} />
                </video>
              ) : (
                <img src={media.url} alt={`${product.name} ?곸꽭 ?대?吏 ${index + 1}`} />
              )}
            </MediaCard>
          ))}
        </DetailContentFlow>
      </DetailSection>

      <DetailSection>
        <DetailTitle>사이즈</DetailTitle>
        <SizeTable>
          <thead>
            <tr>
              <th>Size</th>
              <th>어깨</th>
              <th>Chest</th>
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

      {isShareOpen && (
        <>
          <ShareBackdrop onClick={() => setIsShareOpen(false)} />
          <ShareModal>
            <ShareHead>
              <h4>공유하기</h4>
              <button type="button" onClick={() => setIsShareOpen(false)}>×</button>
            </ShareHead>

            <ShareChannels>
              <ShareChannel type="button" onClick={() => openShareWindow('line')}>
                <CircleIcon $bg="#22c55e">L</CircleIcon>
                <span>라인</span>
              </ShareChannel>
              <ShareChannel type="button" onClick={() => openShareWindow('band')}>
                <CircleIcon $bg="#6b7280">B</CircleIcon>
                <span>밴드</span>
              </ShareChannel>
              <ShareChannel type="button" onClick={() => openShareWindow('naver')}>
                <CircleIcon $bg="#16a34a">N</CircleIcon>
                <span>Naver</span>
              </ShareChannel>
              <ShareChannel type="button" onClick={() => openShareWindow('facebook')}>
                <CircleIcon $bg="#3b82f6">f</CircleIcon>
                <span>페이스북</span>
              </ShareChannel>
              <ShareChannel type="button" onClick={() => openShareWindow('x')}>
                <CircleIcon $bg="#111827">X</CircleIcon>
                <span>X</span>
              </ShareChannel>
            </ShareChannels>

            <ShareCopyRow>
              <input value={shareUrl} readOnly />
              <button type="button" onClick={handleCopyShareUrl}>복사</button>
            </ShareCopyRow>
          </ShareModal>
        </>
      )}

      {isCartModalOpen && (
        <>
          <CartBackdrop onClick={() => setIsCartModalOpen(false)} />
          <CartModal>
            <CartMessage>선택하신 상품을 장바구니에 담았습니다.</CartMessage>
            <CartActions>
              <CartActionBtn type="button" onClick={() => setIsCartModalOpen(false)}>
                계속쇼핑
              </CartActionBtn>
              <CartActionBtn
                type="button"
                onClick={() => {
                  setIsCartModalOpen(false);
                  navigate('/cart');
                }}
              >
                장바구니
              </CartActionBtn>
            </CartActions>
          </CartModal>
        </>
      )}
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

const NameRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const ShareBtn = styled.button`
  width: 42px;
  height: 42px;
  border: none;
  background: transparent;
  color: #666;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const ShareIcon = styled.svg`
  width: 20px;
  height: 20px;
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

const ColorButton = styled.button<{ $colorCode: string; $selected: boolean; $blocked?: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${props => props.$colorCode};
  border: 1px solid #ddd;
  cursor: ${props => (props.$blocked ? 'not-allowed' : 'pointer')};
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: -4px;
    left: -4px;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: 1px solid ${props => props.$selected ? '#333' : 'transparent'};
  }

  &::before {
    content: '';
    display: ${props => (props.$blocked ? 'block' : 'none')};
    position: absolute;
    left: 0;
    top: 0;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background:
      linear-gradient(
        45deg,
        transparent calc(50% - 0.75px),
        rgba(242, 242, 242, 0.95) calc(50% - 0.75px),
        rgba(196, 196, 196, 0.95) calc(50% + 0.75px),
        transparent calc(50% + 0.75px)
      ),
      linear-gradient(
        -45deg,
        transparent calc(50% - 0.75px),
        rgba(242, 242, 242, 0.95) calc(50% - 0.75px),
        rgba(196, 196, 196, 0.95) calc(50% + 0.75px),
        transparent calc(50% + 0.75px)
      );
  }
`;

const SizeGrid = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const SizeButton = styled.button<{ $selected: boolean }>`
  min-width: 48px;
  height: 48px;
  padding: 0 16px;
  border: 1px solid ${props => props.$selected ? '#333' : '#ddd'};
  background-color: ${props => props.$selected ? '#333' : 'transparent'};
  color: ${props => props.$selected ? '#fff' : '#333'};
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

const ScrapBtn = styled.button<{ $active?: boolean }>`
  width: 82px;
  height: 56px;
  border: 1px solid ${(props) => (props.$active ? '#111827' : '#ddd')};
  background: #fff;
  color: ${(props) => (props.$active ? '#111827' : '#555')};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    width: 82px;
    height: 52px;
  }
`;

const HeartIcon = styled.svg`
  width: 22px;
  height: 22px;
`;

const ShareBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 90;
`;

const ShareModal = styled.div`
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: min(92vw, 400px);
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.22);
  padding: 18px 18px 16px;
  z-index: 100;
`;

const ShareHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  h4 {
    font-size: 28px;
    color: #1f2937;
    font-weight: 700;
  }

  button {
    border: none;
    background: transparent;
    color: #6b7280;
    font-size: 26px;
    cursor: pointer;
    line-height: 1;
  }
`;

const ShareChannels = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px 10px;
  margin-bottom: 16px;
`;

const ShareChannel = styled.button`
  border: none;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;

  span {
    font-size: 13px;
    color: #4b5563;
  }
`;

const CircleIcon = styled.div<{ $bg: string }>`
  width: 66px;
  height: 66px;
  border-radius: 50%;
  background: ${(props) => props.$bg};
  color: #fff;
  font-size: 34px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ShareCopyRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  border: 1px solid #d1d5db;

  input {
    border: none;
    height: 40px;
    padding: 0 12px;
    font-size: 13px;
    color: #4b5563;

    &:focus {
      outline: none;
    }
  }

  button {
    border: none;
    border-left: 1px solid #d1d5db;
    background: #f9fafb;
    color: #374151;
    font-size: 14px;
    width: 68px;
    cursor: pointer;
  }
`;

const CartBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 105;
`;

const CartModal = styled.div`
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: min(92vw, 420px);
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.24);
  overflow: hidden;
  z-index: 110;
`;

const CartMessage = styled.p`
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #333;
  border-bottom: 1px solid #e5e7eb;
`;

const CartActions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
`;

const CartActionBtn = styled.button`
  height: 62px;
  border: none;
  background: #fff;
  color: #333;
  font-size: 16px;
  cursor: pointer;

  &:first-child {
    border-right: 1px solid #e5e7eb;
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

const DetailContentFlow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const MediaCard = styled.div`
  width: 100%;
  background: #f4f4f4;
  overflow: hidden;

  img,
  video {
    width: 100%;
    height: auto;
    display: block;
    object-fit: contain;
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
