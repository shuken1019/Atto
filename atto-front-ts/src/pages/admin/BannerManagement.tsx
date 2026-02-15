import React from 'react';
import styled from 'styled-components';

const BannerManagement: React.FC = () => {
  return (
    <Container>
      <Title>메인 배너 관리</Title>

      <EditForm>
        <SectionTitle>상단 배너 설정</SectionTitle>
        <InputGroup>
          <Label>배너 메인 문구</Label>
          <Input placeholder="예: ESSENTIALS" />
        </InputGroup>
        <InputGroup>
          <Label>시즌 문구</Label>
          <Input placeholder="예: SPRING / SUMMER 2024" />
        </InputGroup>
        <InputGroup>
          <Label>배너 이미지</Label>
          <ImagePreviewBox>현재 배너 이미지</ImagePreviewBox>
          <UploadBtn type="button">이미지 변경</UploadBtn>
        </InputGroup>

        <SaveBtn type="button">메인 배너 저장</SaveBtn>
      </EditForm>
    </Container>
  );
};

export default BannerManagement;

const Container = styled.div`
  padding: 20px;
`;

const Title = styled.h2`
  font-size: 24px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 500;
  margin-bottom: 20px;
`;

const EditForm = styled.div`
  max-width: 800px;
  background: #fff;
  border: 1px solid #eee;
  padding: 30px;
  border-radius: 8px;
`;

const SectionTitle = styled.h4`
  margin-bottom: 20px;
  color: #1a1a1a;
  font-size: 18px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 500;
`;

const InputGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 13px;
  color: #555;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  border: 1px solid #ddd;
  padding: 10px 12px;
  font-size: 14px;
`;

const ImagePreviewBox = styled.div`
  width: 100%;
  height: 180px;
  border: 1px dashed #ccc;
  color: #888;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
`;

const UploadBtn = styled.button`
  border: 1px solid #ddd;
  background: #fff;
  font-size: 13px;
  padding: 8px 12px;
  cursor: pointer;
`;

const SaveBtn = styled.button`
  width: 100%;
  padding: 16px;
  background: #1a1a1a;
  color: #fff;
  border: none;
  font-weight: 700;
  margin-top: 10px;
  cursor: pointer;
`;
