import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import type { CategoryType } from '../../types/product';
import { ProductImageSVG } from '../../components/common/Placeholders';

type AdminColor = {
  colorId: number;
  name: string;
  code: string;
};

type AdminSize = {
  sizeId: number;
  label: 'S' | 'M' | 'L';
};

const FALLBACK_COLORS: AdminColor[] = [
  { colorId: 1, name: 'Black', code: '#222222' },
  { colorId: 2, name: 'Ivory', code: '#efe9de' },
  { colorId: 3, name: 'White', code: '#ffffff' },
  { colorId: 4, name: 'Gray', code: '#a5a5a5' },
  { colorId: 5, name: 'Navy', code: '#1f2c56' },
];

const AVAILABLE_SIZES: AdminSize[] = [
  { sizeId: 1, label: 'S' },
  { sizeId: 2, label: 'M' },
  { sizeId: 3, label: 'L' },
];

const ProductUpload = () => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryType>('top');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState('');
  const [representativeImages, setRepresentativeImages] = useState<File[]>([]);
  const [availableColors, setAvailableColors] = useState<AdminColor[]>(FALLBACK_COLORS);
  const [selectedSizeIds, setSelectedSizeIds] = useState<number[]>([]);
  const [sizeColorSelections, setSizeColorSelections] = useState<Record<number, number[]>>({});
  const [optionStocks, setOptionStocks] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const representativePreviewUrls = useMemo(
    () => representativeImages.map((file) => URL.createObjectURL(file)),
    [representativeImages]
  );

  useEffect(() => {
    return () => {
      representativePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [representativePreviewUrls]);

  useEffect(() => {
    return () => {
      if (thumbnailPreviewUrl) {
        URL.revokeObjectURL(thumbnailPreviewUrl);
      }
    };
  }, [thumbnailPreviewUrl]);

  useEffect(() => {
    const loadColors = async () => {
      try {
        const response = await fetch('http://127.0.0.1:4000/api/admin/colors');
        const result = await response.json();
        if (!response.ok || !result.ok || !Array.isArray(result.colors)) {
          return;
        }

        const parsed = result.colors
          .map((row: unknown) => {
            const color = row as Partial<AdminColor>;
            const colorId = Number(color.colorId);
            const name = String(color.name ?? '').trim();
            const code = String(color.code ?? '#dddddd').trim() || '#dddddd';
            if (!Number.isInteger(colorId) || colorId <= 0 || !name) return null;
            return { colorId, name, code };
          })
          .filter((row: AdminColor | null): row is AdminColor => Boolean(row));

        if (parsed.length > 0) {
          setAvailableColors(parsed);
        }
      } catch {
        // fallback colors
      }
    };

    loadColors();
  }, []);

  const selectedSizes = useMemo(
    () => AVAILABLE_SIZES.filter((size) => selectedSizeIds.includes(size.sizeId)),
    [selectedSizeIds]
  );

  const selectedColors = useMemo(() => {
    const colorSet = new Set<number>();
    for (const sizeId of selectedSizeIds) {
      const ids = sizeColorSelections[sizeId] ?? [];
      ids.forEach((id) => colorSet.add(id));
    }
    return availableColors.filter((color) => colorSet.has(color.colorId));
  }, [availableColors, selectedSizeIds, sizeColorSelections]);

  const mainImage = thumbnailPreviewUrl || representativePreviewUrls[0] || '';
  const isRealImage = mainImage.length > 0;

  const handleSelectRepresentativeImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files).slice(0, 3) : [];
    setRepresentativeImages(files);
  };

  const handleSelectThumbnail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setThumbnailFile(file);
    if (thumbnailPreviewUrl) {
      URL.revokeObjectURL(thumbnailPreviewUrl);
      setThumbnailPreviewUrl('');
    }
    if (file) {
      setThumbnailPreviewUrl(URL.createObjectURL(file));
    }
  };

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(new Error('file read failed'));
      reader.readAsDataURL(file);
    });

  const optionKey = (sizeId: number, colorId: number) => `${sizeId}:${colorId}`;

  const handleToggleSize = (sizeId: number) => {
    setSelectedSizeIds((prev) => {
      if (prev.includes(sizeId)) {
        const next = prev.filter((id) => id !== sizeId);
        setSizeColorSelections((selections) => {
          const copied = { ...selections };
          delete copied[sizeId];
          return copied;
        });
        setOptionStocks((stocks) => {
          const copied: Record<string, string> = {};
          Object.entries(stocks).forEach(([key, value]) => {
            if (!key.startsWith(`${sizeId}:`)) copied[key] = value;
          });
          return copied;
        });
        return next;
      }

      setSizeColorSelections((selections) => ({ ...selections, [sizeId]: selections[sizeId] ?? [] }));
      return [...prev, sizeId];
    });
  };

  const handleToggleSizeColor = (sizeId: number, colorId: number) => {
    setSizeColorSelections((prev) => {
      const current = prev[sizeId] ?? [];
      if (current.includes(colorId)) {
        const next = current.filter((id) => id !== colorId);
        setOptionStocks((stocks) => {
          const copied = { ...stocks };
          delete copied[optionKey(sizeId, colorId)];
          return copied;
        });
        return { ...prev, [sizeId]: next };
      }

      setOptionStocks((stocks) => ({
        ...stocks,
        [optionKey(sizeId, colorId)]: stocks[optionKey(sizeId, colorId)] ?? '0',
      }));
      return { ...prev, [sizeId]: [...current, colorId] };
    });
  };

  const handleOptionStockChange = (sizeId: number, colorId: number, value: string) => {
    setOptionStocks((prev) => ({ ...prev, [optionKey(sizeId, colorId)]: value }));
  };

  const handleSubmit = async () => {
    const safeName = name.trim();
    const safeDescription = description.trim();
    const priceNum = Number(price);

    if (!safeName) {
      alert('상품명을 입력해주세요.');
      return;
    }
    if (!Number.isInteger(priceNum) || priceNum < 0) {
      alert('가격은 0 이상 정수로 입력해주세요.');
      return;
    }
    if (selectedSizeIds.length === 0) {
      alert('최소 1개 이상의 사이즈를 선택해주세요.');
      return;
    }
    if (!thumbnailFile) {
      alert('썸네일 이미지를 선택해주세요.');
      return;
    }

    const productOptions = selectedSizeIds.flatMap((sizeId) => {
      const colorIds = sizeColorSelections[sizeId] ?? [];
      return colorIds.map((colorId) => {
        const stockNum = Number(optionStocks[optionKey(sizeId, colorId)] ?? 0);
        return {
          colorId,
          sizeId,
          stock: Number.isInteger(stockNum) && stockNum >= 0 ? stockNum : 0,
          additionalPrice: 0,
        };
      });
    });

    if (productOptions.length === 0) {
      alert('사이즈별로 최소 1개 이상의 색상을 선택해주세요.');
      return;
    }

    const colorStockMap: Record<number, number> = {};
    productOptions.forEach((option) => {
      colorStockMap[option.colorId] = (colorStockMap[option.colorId] ?? 0) + option.stock;
    });
    const productColors = Object.entries(colorStockMap).map(([colorId, stock]) => ({
      colorId: Number(colorId),
      stock,
    }));

    setSubmitting(true);
    try {
      const thumbnailDataUrl = await fileToDataUrl(thumbnailFile);

      const response = await fetch('http://127.0.0.1:4000/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: safeName,
          description: safeDescription,
          price: priceNum,
          category,
          status: 'ON_SALE',
          thumbnail: '',
          thumbnailDataUrl,
          thumbnailName: thumbnailFile.name,
          productColors,
          productOptions,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        alert(result.message ?? '상품 등록에 실패했습니다.');
        return;
      }

      alert(`상품 등록 완료 (ID: ${result.productId})`);
      setName('');
      setPrice('');
      setDescription('');
      setThumbnailFile(null);
      if (thumbnailPreviewUrl) {
        URL.revokeObjectURL(thumbnailPreviewUrl);
      }
      setThumbnailPreviewUrl('');
      setRepresentativeImages([]);
      setSelectedSizeIds([]);
      setSizeColorSelections({});
      setOptionStocks({});
    } catch {
      alert('서버 연결에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Page>
      <Header>
        <PageTitle>상품 업로드/수정</PageTitle>
        <PageDesc>상품 기본정보와 색상/재고를 등록합니다.</PageDesc>
      </Header>

      <Workspace>
        <EditorPanel>
          <PanelTitle>입력 폼</PanelTitle>

          <Field>
            <Label htmlFor="product-name">상품명</Label>
            <Input
              id="product-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="상품명을 입력해주세요"
            />
          </Field>

          <Row>
            <Field>
              <Label htmlFor="product-category">카테고리</Label>
              <Select id="product-category" value={category} onChange={(e) => setCategory(e.target.value as CategoryType)}>
                <option value="outer">아우터</option>
                <option value="top">상의</option>
                <option value="bottom">하의</option>
                <option value="acc">악세서리</option>
              </Select>
            </Field>

            <Field>
              <Label htmlFor="product-price">가격 (원)</Label>
              <Input id="product-price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
            </Field>
          </Row>

          <Field>
            <Label htmlFor="product-description">한 줄 요약</Label>
            <TextArea
              id="product-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="상품 설명을 입력해주세요"
            />
          </Field>

          <Field>
            <Label htmlFor="product-thumbnail-file">썸네일</Label>
            <SmallUploadButton htmlFor="product-thumbnail-file">썸네일 불러오기</SmallUploadButton>
            <HiddenFileInput id="product-thumbnail-file" type="file" accept="image/*" onChange={handleSelectThumbnail} />
            <ThumbnailMeta>{thumbnailFile ? thumbnailFile.name : '선택된 파일 없음'}</ThumbnailMeta>
          </Field>

          <Field>
            <Label htmlFor="representative-images">대표 이미지 (최대 3장, 미리보기 전용)</Label>
            <UploadButton htmlFor="representative-images">대표 이미지 선택</UploadButton>
            <HiddenFileInput id="representative-images" type="file" accept="image/*" multiple onChange={handleSelectRepresentativeImages} />
          </Field>

          <Field>
            <Label>사이즈 선택</Label>
            <SizeGrid>
              {AVAILABLE_SIZES.map((size) => (
                <SizeButton
                  key={size.sizeId}
                  type="button"
                  selected={selectedSizeIds.includes(size.sizeId)}
                  onClick={() => handleToggleSize(size.sizeId)}
                >
                  {size.label}
                </SizeButton>
              ))}
            </SizeGrid>
          </Field>

          {selectedSizes.map((size) => (
            <Field key={`color-${size.sizeId}`}>
              <Label>{size.label} 색상 선택</Label>
              <ColorGrid>
                {availableColors.map((color) => (
                  <ColorButton
                    key={`${size.sizeId}-${color.colorId}`}
                    type="button"
                    colorCode={color.code}
                    selected={(sizeColorSelections[size.sizeId] ?? []).includes(color.colorId)}
                    onClick={() => handleToggleSizeColor(size.sizeId, color.colorId)}
                    title={color.name}
                  />
                ))}
              </ColorGrid>
            </Field>
          ))}

          {selectedSizes.map((size) => {
            const colorIds = sizeColorSelections[size.sizeId] ?? [];
            const colors = availableColors.filter((color) => colorIds.includes(color.colorId));
            if (colors.length === 0) return null;
            return (
              <Field key={`stock-${size.sizeId}`}>
                <Label>{size.label} 색상별 재고</Label>
                <StockList>
                  {colors.map((color) => (
                    <StockRow key={`${size.sizeId}-${color.colorId}`}>
                      <StockColor>
                        <Dot style={{ backgroundColor: color.code }} />
                        {color.name}
                      </StockColor>
                      <StockInput
                        type="number"
                        min={0}
                        value={optionStocks[optionKey(size.sizeId, color.colorId)] ?? '0'}
                        onChange={(e) => handleOptionStockChange(size.sizeId, color.colorId, e.target.value)}
                      />
                    </StockRow>
                  ))}
                </StockList>
              </Field>
            );
          })}

          {selectedColors.length > 0 && (
            <Field>
              <Label>선택된 색상 미리보기</Label>
              <StockList>
                {selectedColors.map((color) => (
                  <StockRow key={color.colorId}>
                    <StockColor>
                      <Dot style={{ backgroundColor: color.code }} />
                      {color.name}
                    </StockColor>
                  </StockRow>
                ))}
              </StockList>
            </Field>
          )}

          <SubmitButton type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting ? '등록 중...' : '상품 등록'}
          </SubmitButton>
        </EditorPanel>

        <PreviewPanel>
          <PreviewScroll>
            <Container>
              <ImageSection>
                <ImageWrapper>
                  {isRealImage ? (
                    <img src={mainImage} alt={name || 'preview'} />
                  ) : (
                    <ProductImageSVG type={category} />
                  )}
                </ImageWrapper>
              </ImageSection>

              <InfoSection>
                <CategoryLabel>{category.toUpperCase()}</CategoryLabel>
                <ProductName>{name || '상품명을 입력해주세요'}</ProductName>
                <Price>₩{Number(price || 0).toLocaleString()}</Price>
                <Description>{description || '상품 요약을 입력해주세요.'}</Description>
                <Divider />
                <OptionLabel>Size</OptionLabel>
                <SizeGrid>
                  {selectedSizes.map((size) => (
                    <SizeButton key={`preview-size-${size.sizeId}`} type="button" selected>
                      {size.label}
                    </SizeButton>
                  ))}
                </SizeGrid>
                <Divider />
                <OptionLabel>Color</OptionLabel>
                <ColorGrid>
                  {selectedColors.map((color) => (
                    <ColorButton key={`preview-${color.colorId}`} type="button" colorCode={color.code} selected title={color.name} />
                  ))}
                </ColorGrid>
              </InfoSection>
            </Container>
          </PreviewScroll>
        </PreviewPanel>
      </Workspace>
    </Page>
  );
};

export default ProductUpload;

const Page = styled.div`
  padding: 24px;
  background: #f7f5f0;
  min-height: 100vh;
`;

const Header = styled.div`
  max-width: 1400px;
  margin: 0 auto 20px;
`;

const PageTitle = styled.h2`
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 30px;
  font-weight: 500;
  margin-bottom: 6px;
`;

const PageDesc = styled.p`
  font-size: 13px;
  color: #6f6f6f;
`;

const Workspace = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 20px;

  @media (max-width: 1080px) {
    grid-template-columns: 1fr;
  }
`;

const EditorPanel = styled.aside`
  background: #fff;
  border: 1px solid #ece7de;
  padding: 20px;
  height: fit-content;
`;

const PanelTitle = styled.h3`
  font-size: 18px;
  margin-bottom: 16px;
`;

const Field = styled.div`
  margin-bottom: 16px;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const Label = styled.label`
  display: block;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 6px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  font-size: 14px;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  resize: vertical;
  font-size: 13px;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  font-size: 14px;
`;

const UploadButton = styled.label`
  border: 1px solid #ddd;
  background: #fff;
  padding: 8px 10px;
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
`;

const SmallUploadButton = styled.label`
  border: 1px solid #ddd;
  background: #fff;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
  display: inline-flex;
`;

const ThumbnailMeta = styled.p`
  margin-top: 6px;
  font-size: 12px;
  color: #666;
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const ColorGrid = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const SizeGrid = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const SizeButton = styled.button<{ selected: boolean }>`
  min-width: 44px;
  height: 36px;
  border: 1px solid ${(props) => (props.selected ? '#222' : '#d9d9d9')};
  background: ${(props) => (props.selected ? '#222' : '#fff')};
  color: ${(props) => (props.selected ? '#fff' : '#222')};
  font-size: 13px;
  cursor: pointer;
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

const StockList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const StockRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
`;

const StockColor = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #333;
`;

const Dot = styled.span`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid #ddd;
`;

const StockInput = styled.input`
  width: 90px;
  padding: 6px 8px;
  border: 1px solid #d9d9d9;
  font-size: 13px;
`;

const SubmitButton = styled.button`
  width: 100%;
  border: none;
  background: #333;
  color: #fff;
  height: 46px;
  font-size: 14px;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const PreviewPanel = styled.section`
  background: #fff;
  border: 1px solid #ece7de;
`;

const PreviewScroll = styled.div`
  max-height: calc(100vh - 140px);
  overflow: auto;
`;

const Container = styled.div`
  padding: 64px 20px;
  display: flex;
  gap: 70px;

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 26px 14px 40px;
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
`;

const Price = styled.p`
  font-size: 20px;
  font-weight: 500;
  color: #333;
  margin-bottom: 30px;
`;

const Description = styled.p`
  font-size: 15px;
  line-height: 1.8;
  color: #555;
  margin-bottom: 30px;
  white-space: pre-wrap;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid #e0e0e0;
  margin-bottom: 20px;
`;

const OptionLabel = styled.p`
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
`;
