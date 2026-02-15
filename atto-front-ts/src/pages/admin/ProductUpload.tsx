import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

const ProductUpload: React.FC = () => {
  const [representativeImages, setRepresentativeImages] = useState<File[]>([]);
  const [detailImageFiles, setDetailImageFiles] = useState<File[]>([]);
  const [detailVideoFiles, setDetailVideoFiles] = useState<File[]>([]);
  const [detailDescription, setDetailDescription] = useState('');
  const [sizeGuideText, setSizeGuideText] = useState('');
  const [keyInfoText, setKeyInfoText] = useState('');

  const representativePreviewUrls = useMemo(
    () => representativeImages.map((file) => URL.createObjectURL(file)),
    [representativeImages],
  );

  const detailImagePreviewUrls = useMemo(
    () => detailImageFiles.map((file) => URL.createObjectURL(file)),
    [detailImageFiles],
  );

  const detailVideoPreviewUrls = useMemo(
    () => detailVideoFiles.map((file) => URL.createObjectURL(file)),
    [detailVideoFiles],
  );

  useEffect(() => {
    return () => {
      representativePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      detailImagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      detailVideoPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [representativePreviewUrls, detailImagePreviewUrls, detailVideoPreviewUrls]);

  const handleSelectRepresentativeImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files).slice(0, 3) : [];
    setRepresentativeImages(files);
  };

  const handleSelectDetailImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setDetailImageFiles(files);
  };

  const handleSelectDetailVideos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setDetailVideoFiles(files);
  };

  const handleSubmit = () => {
    alert('상품 등록 폼이 작성되었습니다. (현재는 UI 목업)');
  };

  return (
    <Page>
      <Editor>
        <PageTitle>상품 업로드</PageTitle>
        <PageDesc>상품 상세 페이지를 직접 작성하는 느낌으로, 위에서 아래로 순서대로 입력하세요.</PageDesc>

        <Field>
          <Label htmlFor="product-name">상품명</Label>
          <TitleInput id="product-name" placeholder="상품명을 입력하세요" />
        </Field>

        <MetaRow>
          <Field>
            <Label htmlFor="product-category">카테고리</Label>
            <Select id="product-category" name="productCategory" title="상품 카테고리" aria-label="상품 카테고리">
              <option>아우터</option>
              <option>상의</option>
              <option>하의</option>
              <option>악세서리</option>
            </Select>
          </Field>
          <Field>
            <Label htmlFor="product-price">가격 (원)</Label>
            <Input id="product-price" type="number" placeholder="0" />
          </Field>
        </MetaRow>

        <Field>
          <Label htmlFor="product-description">한 줄 요약</Label>
          <Input id="product-description" placeholder="상품 리스트에 노출될 짧은 설명" />
        </Field>

        <Field>
          <Label htmlFor="representative-images">대표 이미지 (최대 3장)</Label>
          <UploadButton htmlFor="representative-images">대표 이미지 선택</UploadButton>
          <HiddenFileInput
            id="representative-images"
            type="file"
            accept="image/*"
            multiple
            aria-label="대표 이미지 업로드"
            onChange={handleSelectRepresentativeImages}
          />
          <Help>Shop 카드에서는 대표 이미지가 마우스 오버 시 자동으로 넘어갑니다.</Help>
          <VerticalMediaList>
            {representativePreviewUrls.length === 0 && <EmptyHint>대표 이미지를 업로드해주세요.</EmptyHint>}
            {representativePreviewUrls.map((url, idx) => (
              <MediaBlock key={`${url}-${idx}`}>
                <img src={url} alt={`대표 이미지 ${idx + 1}`} />
              </MediaBlock>
            ))}
          </VerticalMediaList>
        </Field>

        <Field>
          <Label htmlFor="detail-images">상세 추가 이미지</Label>
          <UploadButton htmlFor="detail-images">추가 이미지 선택</UploadButton>
          <HiddenFileInput
            id="detail-images"
            type="file"
            accept="image/*"
            multiple
            aria-label="상세 추가 이미지 업로드"
            onChange={handleSelectDetailImages}
          />
          <VerticalMediaList>
            {detailImagePreviewUrls.length === 0 && <EmptyHint>상세 이미지를 업로드해주세요.</EmptyHint>}
            {detailImagePreviewUrls.map((url, idx) => (
              <MediaBlock key={`${url}-${idx}`}>
                <img src={url} alt={`상세 이미지 ${idx + 1}`} />
              </MediaBlock>
            ))}
          </VerticalMediaList>
        </Field>

        <Field>
          <Label htmlFor="detail-videos">상세 추가 동영상</Label>
          <UploadButton htmlFor="detail-videos">추가 동영상 선택</UploadButton>
          <HiddenFileInput
            id="detail-videos"
            type="file"
            accept="video/*"
            multiple
            aria-label="상세 추가 동영상 업로드"
            onChange={handleSelectDetailVideos}
          />
          <VerticalMediaList>
            {detailVideoPreviewUrls.length === 0 && <EmptyHint>상세 동영상을 업로드해주세요.</EmptyHint>}
            {detailVideoPreviewUrls.map((url, idx) => (
              <MediaBlock key={`${url}-${idx}`}>
                <video src={url} controls />
              </MediaBlock>
            ))}
          </VerticalMediaList>
        </Field>

        <Field>
          <Label htmlFor="detail-description">상세 설명란</Label>
          <LongTextArea
            id="detail-description"
            rows={12}
            placeholder="블로그 글 작성하듯 상세 설명을 입력하세요"
            value={detailDescription}
            onChange={(e) => setDetailDescription(e.target.value)}
          />
        </Field>

        <Field>
          <Label htmlFor="size-guide">사이즈 표 입력란</Label>
          <TextArea
            id="size-guide"
            rows={6}
            placeholder={'예)\nS,44,51,67\nM,46,54,69\nL,48,57,71'}
            value={sizeGuideText}
            onChange={(e) => setSizeGuideText(e.target.value)}
          />
        </Field>

        <Field>
          <Label htmlFor="key-info">상품 주요정보 입력란</Label>
          <TextArea
            id="key-info"
            rows={6}
            placeholder={'예)\n소재: Linen 70% / Cotton 30%\n제조국: 대한민국\n세탁: 드라이클리닝 권장'}
            value={keyInfoText}
            onChange={(e) => setKeyInfoText(e.target.value)}
          />
        </Field>

        <SubmitButton type="button" onClick={handleSubmit}>
          상품 등록
        </SubmitButton>
      </Editor>
    </Page>
  );
};

export default ProductUpload;

const Page = styled.div`
  padding: 32px;
  background: #f6f4ef;
  min-height: 100vh;
`;

const Editor = styled.div`
  max-width: 860px;
  margin: 0 auto;
  background: #fff;
  border: 1px solid #ebe6dd;
  padding: 28px;

  @media (max-width: 768px) {
    padding: 18px;
  }
`;

const PageTitle = styled.h2`
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 500;
  font-size: 28px;
  margin-bottom: 8px;
`;

const PageDesc = styled.p`
  font-size: 13px;
  color: #777;
  margin-bottom: 24px;
`;

const Field = styled.div`
  margin-bottom: 22px;
`;

const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #333;
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const MetaRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  font-size: 14px;
`;

const TitleInput = styled(Input)`
  font-size: 18px;
  padding: 14px;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  resize: vertical;
  font-size: 14px;
`;

const LongTextArea = styled(TextArea)`
  min-height: 240px;
  line-height: 1.8;
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  font-size: 14px;
`;

const UploadButton = styled.label`
  border: 1px solid #ddd;
  background: #fff;
  padding: 9px 12px;
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
`;

const Help = styled.p`
  margin-top: 8px;
  font-size: 12px;
  color: #8a8a8a;
`;

const VerticalMediaList = styled.div`
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const MediaBlock = styled.div`
  width: 100%;
  aspect-ratio: 3 / 4;
  background: #f5f5f5;
  border: 1px solid #eee;
  overflow: hidden;

  img,
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const EmptyHint = styled.div`
  border: 1px dashed #ddd;
  padding: 18px;
  text-align: center;
  color: #999;
  font-size: 13px;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 16px;
  background: #1a1a1a;
  color: #fff;
  border: none;
  font-weight: 600;
  cursor: pointer;
  margin-top: 6px;
`;
