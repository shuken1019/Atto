import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import type { CategoryType } from '../../types/product';
import { ProductImageSVG } from '../../components/common/Placeholders';

interface ColorOption {
  name: string;
  code: string;
}

interface SizeRow {
  label: string;
  shoulder: string;
  chest: string;
  length: string;
}

const DEFAULT_COLORS: ColorOption[] = [
  { name: 'Black', code: '#222222' },
  { name: 'Ivory', code: '#efe9de' },
];

const DEFAULT_SIZES = ['S', 'M', 'L'];

const ProductUpload = () => {
  const [name, setName] = useState('Linen Relaxed Shirt');
  const [category, setCategory] = useState<CategoryType>('top');
  const [price, setPrice] = useState('89000');
  const [description, setDescription] = useState('부드러운 린넨 텍스처와 여유로운 핏의 데일리 셔츠');
  const [detailDescription] = useState('여유로운 실루엣으로 다양한 하의와 자연스럽게 어울립니다.\n가볍고 통기성이 좋아 사계절 레이어드 아이템으로 활용하기 좋습니다.');

  const [colorText, setColorText] = useState('Black,#222222\nIvory,#efe9de');
  const [sizeText, setSizeText] = useState('S, M, L');
  const [sizeGuideText, setSizeGuideText] = useState('S,44,51,67\nM,46,54,69\nL,48,57,71');
  const [keyInfoText, setKeyInfoText] = useState('소재: Linen 70% / Cotton 30%\n제조국: 대한민국\n세탁: 드라이클리닝 권장');

  const [representativeImages, setRepresentativeImages] = useState<File[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const navigate = useNavigate();

  const representativePreviewUrls = useMemo(
    () => representativeImages.map((file) => URL.createObjectURL(file)),
    [representativeImages],
  );

  useEffect(() => {
    return () => {
      representativePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [representativePreviewUrls]);

  const colorOptions = useMemo<ColorOption[]>(() => {
    const parsed = colorText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [namePart, codePart] = line.split(',').map((value) => value?.trim());
        return {
          name: namePart || '',
          code: codePart || '#dddddd',
        };
      })
      .filter((item) => item.name.length > 0);

    return parsed.length > 0 ? parsed : DEFAULT_COLORS;
  }, [colorText]);

  const sizeOptions = useMemo<string[]>(() => {
    const parsed = sizeText
      .split(',')
      .map((size) => size.trim())
      .filter(Boolean);

    return parsed.length > 0 ? parsed : DEFAULT_SIZES;
  }, [sizeText]);

  const sizeRows = useMemo<SizeRow[]>(() => {
    return sizeGuideText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, shoulder, chest, length] = line.split(',').map((value) => value.trim());
        return {
          label: label || '-',
          shoulder: shoulder || '-',
          chest: chest || '-',
          length: length || '-',
        };
      });
  }, [sizeGuideText]);

  const keyInfos = useMemo(() => {
    return keyInfoText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }, [keyInfoText]);

  const mainImage = representativePreviewUrls[0] || '';
  const isRealImage = mainImage.length > 0;

  const handleSelectRepresentativeImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files).slice(0, 3) : [];
    setRepresentativeImages(files);
  };

  const handleSubmit = () => {
    alert('상품 등록 UI 목업입니다. 현재는 미리보기 기반 편집만 동작합니다.');
  };

  return (
    <Page>
      <Header>
        <PageTitle>상품 업로드/수정</PageTitle>
        <PageDesc>왼쪽에서 값을 수정하면 오른쪽 Product 페이지 미리보기가 즉시 반영됩니다.</PageDesc>
      </Header>

      <Workspace>
        <EditorPanel>
          <PanelTitle>편집 패널</PanelTitle>

          <Field>
            <Label htmlFor="product-name">상품명</Label>
            <Input
              id="product-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="상품명을 입력하세요"
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
              <Input
                id="product-price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
              />
            </Field>
          </Row>

          <Field>
            <Label htmlFor="product-description">한 줄 요약</Label>
            <TextArea
              id="product-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          <Field>
            <Label htmlFor="representative-images">대표 이미지 (최대 3장)</Label>
            <UploadButton htmlFor="representative-images">대표 이미지 선택</UploadButton>
            <HiddenFileInput id="representative-images" type="file" accept="image/*" multiple onChange={handleSelectRepresentativeImages} />
          </Field>

          <ContentField>
            <Label>상세 콘텐츠 (상세내용 + 상세이미지 + 상세동영상)</Label>
            <EditorTabs>
              <EditorTab type="button" $active onClick={() => navigate('/admin/upload/direct-write')}>직접 작성</EditorTab>
              <EditorTab type="button" onClick={() => navigate('/admin/upload/html-write')}>HTML 작성</EditorTab>
            </EditorTabs>
          </ContentField>

          <Field>
            <Label htmlFor="color-options">컬러 옵션 (줄바꿈: 컬러명,헥사코드)</Label>
            <TextArea
              id="color-options"
              rows={4}
              value={colorText}
              onChange={(e) => setColorText(e.target.value)}
              placeholder={'Black,#222222\nIvory,#efe9de'}
            />
          </Field>

          <Field>
            <Label htmlFor="size-options">사이즈 옵션 (콤마 구분)</Label>
            <Input
              id="size-options"
              value={sizeText}
              onChange={(e) => setSizeText(e.target.value)}
              placeholder="S, M, L"
            />
          </Field>

          <Field>
            <Label htmlFor="size-guide">사이즈 표 (줄바꿈: 사이즈,어깨,가슴,총장)</Label>
            <TextArea
              id="size-guide"
              rows={5}
              value={sizeGuideText}
              onChange={(e) => setSizeGuideText(e.target.value)}
            />
          </Field>

          <Field>
            <Label htmlFor="key-info">상품 주요 정보 (줄바꿈 구분)</Label>
            <TextArea id="key-info" rows={5} value={keyInfoText} onChange={(e) => setKeyInfoText(e.target.value)} />
          </Field>

          <SubmitButton type="button" onClick={handleSubmit}>
            상품 등록
          </SubmitButton>
        </EditorPanel>

        <PreviewPanel>
          <PreviewScroll>
            <Container>
              <ImageSection>
                <ImageWrapper>
                  {isRealImage ? (
                    <img src={mainImage} alt={name} />
                  ) : (
                    <ProductImageSVG type={category} />
                  )}
                </ImageWrapper>
              </ImageSection>

              <InfoSection>
                <CategoryLabel>{category.toUpperCase()}</CategoryLabel>
                <ProductName>{name || '상품명을 입력하세요'}</ProductName>
                <Price>₩{Number(price || 0).toLocaleString()}</Price>

                <Description>{description || '상품 요약을 입력하세요.'}</Description>

                <Divider />

                <OptionsWrapper>
                  <OptionGroup>
                    <OptionLabel>Color</OptionLabel>
                    <ColorGrid>
                      {colorOptions.map((color) => (
                        <ColorButton
                          key={`${color.name}-${color.code}`}
                          colorCode={color.code}
                          selected={selectedColor === color.name}
                          onClick={() => setSelectedColor(color.name)}
                          title={color.name}
                        />
                      ))}
                    </ColorGrid>
                    {selectedColor && <SelectedText>{selectedColor}</SelectedText>}
                  </OptionGroup>

                  <OptionGroup>
                    <OptionLabel>Size</OptionLabel>
                    <SizeGrid>
                      {sizeOptions.map((size) => (
                        <SizeButton key={size} selected={selectedSize === size} onClick={() => setSelectedSize(size)}>
                          {size}
                        </SizeButton>
                      ))}
                    </SizeGrid>
                  </OptionGroup>
                </OptionsWrapper>

                <ButtonGroup>
                  <AddToCartBtn type="button">ADD TO CART</AddToCartBtn>
                  <BuyNowBtn type="button">BUY NOW</BuyNowBtn>
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
                <DetailParagraph>{detailDescription || '상세 설명을 입력하세요.'}</DetailParagraph>
              </DetailContentFlow>
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
                  {sizeRows.map((row) => (
                    <tr key={`${row.label}-${row.shoulder}-${row.chest}-${row.length}`}>
                      <td>{row.label}</td>
                      <td>{row.shoulder}</td>
                      <td>{row.chest}</td>
                      <td>{row.length}</td>
                    </tr>
                  ))}
                </tbody>
              </SizeTable>
            </DetailSection>

            <DetailSection>
              <DetailTitle>상품 주요 정보</DetailTitle>
              <KeyInfoList>
                {keyInfos.map((info) => (
                  <li key={info}>{info}</li>
                ))}
              </KeyInfoList>
            </DetailSection>
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

const ContentField = styled(Field)`
  padding: 12px;
  border: 1px solid #ece7de;
  background: #fcfbf8;
`;

const EditorTabs = styled.div`
  display: flex;
  border: 1px solid #111827;
  background: #fff;
`;

const EditorTab = styled.button<{ $active?: boolean }>`
  flex: 1;
  height: 52px;
  border: none;
  border-right: 1px solid #111827;
  background: ${(props) => (props.$active ? '#111827' : '#ffffff')};
  font-size: 16px;
  color: ${(props) => (props.$active ? '#ffffff' : '#1f2937')};
  font-weight: 600;
  cursor: pointer;

  &:last-child {
    border-right: none;
  }
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

const HiddenFileInput = styled.input`
  display: none;
`;

const SubmitButton = styled.button`
  width: 100%;
  border: none;
  background: #333;
  color: #fff;
  height: 46px;
  font-size: 14px;
  cursor: pointer;
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
  margin-bottom: 30px;
`;

const OptionsWrapper = styled.div`
  margin-bottom: 34px;
`;

const OptionGroup = styled.div`
  margin-bottom: 22px;
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
  height: 46px;
  padding: 0 16px;
  border: 1px solid ${(props) => (props.selected ? '#333' : '#ddd')};
  background-color: ${(props) => (props.selected ? '#333' : 'transparent')};
  color: ${(props) => (props.selected ? '#fff' : '#333')};
  font-size: 14px;
  cursor: pointer;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 34px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const AddToCartBtn = styled.button`
  flex: 1;
  height: 54px;
  background-color: #333;
  color: #fff;
  border: none;
  font-size: 14px;
`;

const BuyNowBtn = styled.button`
  flex: 1;
  height: 54px;
  background-color: #fff;
  color: #333;
  border: 1px solid #333;
  font-size: 14px;
`;

const ExtraInfo = styled.div`
  font-size: 13px;
  color: #888;
  line-height: 1.6;
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
