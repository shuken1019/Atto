// src/pages/admin/ProductUpload.tsx
//직관적인 상품 등록 폼
import React, { useState } from 'react';
import styled from 'styled-components';

const ProductUpload: React.FC = () => {
  const [images, setImages] = useState<File[]>([]);
  const onImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    setImages(Array.from(files));
  };

  return (
    <AdminContainer>
      <Title>New Product Registration</Title>
      
      <FormGrid>
        {/* 1. 이미지 업로드 섹션 (드래그 앤 드롭 느낌) */}
        <UploadSection>
          <Label>Product Images</Label>
          <ImagePlaceholder>
            <span>+ Click to Upload Photos {images.length > 0 ? `(${images.length})` : ''}</span>
            <input type="file" multiple style={{display:'none'}} onChange={onImageChange} />
          </ImagePlaceholder>
          <HelperText>권장 사이즈: 900x1200 (3:4 비율)</HelperText>
        </UploadSection>

        {/* 2. 상세 정보 입력 섹션 */}
        <InfoSection>
          <InputGroup>
            <Label>Product Name</Label>
            <Input placeholder="상품명을 입력하세요" />
          </InputGroup>

          <Row>
            <InputGroup>
              <Label>Category</Label>
              <Select>
                <option>아우터</option>
                <option>상의</option>
                <option>하의</option>
                <option>악세서리</option>
              </Select>
            </InputGroup>
            <InputGroup>
              <Label>Price (KRW)</Label>
              <Input type="number" placeholder="0" />
            </InputGroup>
          </Row>

          <InputGroup>
            <Label>Description</Label>
            <TextArea placeholder="소재감, 핏 등 상품 설명을 입력하세요" rows={5} />
          </InputGroup>

          {/* 3. 색상 및 사이즈 (JSON 구조를 쉽게 입력) */}
          <OptionSection>
            <Label>Options (Color & Size)</Label>
            <OptionRow>
              <Input placeholder="Color (예: Charcoal)" style={{flex: 2}} />
              <Input placeholder="Sizes (예: S, M, L)" style={{flex: 3}} />
              <AddButton>Add Option</AddButton>
            </OptionRow>
          </OptionSection>

          <SubmitButton>PUBLISH PRODUCT</SubmitButton>
        </InfoSection>
      </FormGrid>
    </AdminContainer>
  );
};

export default ProductUpload;

// ---------- Styled Components (간략화) ----------
const AdminContainer = styled.div` padding: 40px; background: #fff; min-height: 100vh; `;
const Title = styled.h2` font-family: 'Playfair Display', serif; font-size: 28px; margin-bottom: 40px; `;
const FormGrid = styled.div` display: grid; grid-template-columns: 1fr 1.5fr; gap: 60px; `;
const Label = styled.label` display: block; font-size: 13px; font-weight: 600; margin-bottom: 10px; color: #333; `;
const InputGroup = styled.div``;
const ImagePlaceholder = styled.div` width: 100%; aspect-ratio: 3/4; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; cursor: pointer; background: #f9f9f9; color: #888; &:hover { background: #f0f0f0; } `;
const Input = styled.input` width: 100%; padding: 12px; border: 1px solid #ddd; margin-bottom: 20px; `;
const TextArea = styled.textarea` width: 100%; padding: 12px; border: 1px solid #ddd; resize: none; `;
const Select = styled.select` width: 100%; padding: 12px; border: 1px solid #ddd; `;
const Row = styled.div` display: flex; gap: 20px; `;
const SubmitButton = styled.button` width: 100%; padding: 20px; background: #1a1a1a; color: #fff; border: none; font-weight: 600; cursor: pointer; margin-top: 20px; `;
const OptionRow = styled.div` display: flex; gap: 10px; margin-bottom: 10px; `;
const AddButton = styled.button` padding: 0 15px; background: #eee; border: 1px solid #ddd; cursor: pointer; `;
const UploadSection = styled.div``;
const InfoSection = styled.div``;
const HelperText = styled.p` font-size: 12px; color: #999; margin-top: 10px; `;
const OptionSection = styled.div` margin-bottom: 30px; padding: 20px; background: #f9f9f9; `;
