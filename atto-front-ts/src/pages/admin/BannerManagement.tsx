import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

const BANNER_STORAGE_KEY = 'atto_banner_settings';

type BannerSettings = {
  mainText: string;
  seasonText: string;
  imageDataUrl: string;
};

const BannerManagement: React.FC = () => {
  const [mainText, setMainText] = useState('ESSENTIALS');
  const [seasonText, setSeasonText] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem(BANNER_STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Partial<BannerSettings>;
      setMainText(parsed.mainText ?? 'ESSENTIALS');
      setSeasonText(parsed.seasonText ?? '');
      setImageDataUrl(parsed.imageDataUrl ?? '');
    } catch {
      // invalid localStorage data
    }
  }, []);

  const handleChangeImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(String(reader.result || ''));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const payload: BannerSettings = {
      mainText: mainText.trim(),
      seasonText: seasonText.trim(),
      imageDataUrl,
    };

    localStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new Event('banner-updated'));
    alert('메인 배너 설정이 저장되었습니다.');
  };

  return (
    <Container>
      <Title>메인 배너 관리</Title>

      <EditForm>
        <SectionTitle>상단 배너 설정</SectionTitle>
        <InputGroup>
          <Label>배너 메인 문구</Label>
          <Input
            placeholder="예: ESSENTIALS"
            value={mainText}
            onChange={(e) => setMainText(e.target.value)}
          />
        </InputGroup>
        <InputGroup>
          <Label>시즌 문구</Label>
          <Input
            placeholder="예: SPRING / SUMMER 2024"
            value={seasonText}
            onChange={(e) => setSeasonText(e.target.value)}
          />
        </InputGroup>
        <InputGroup>
          <Label>배너 이미지</Label>
          <HelperText>권장 기본 사이즈: 1600 x 600px (JPG/PNG)</HelperText>
          <ImagePreviewBox>
            {imageDataUrl ? <img src={imageDataUrl} alt="배너 미리보기" /> : '현재 배너 이미지'}
          </ImagePreviewBox>
          <UploadBtn as="label" htmlFor="banner-image-input">이미지 변경</UploadBtn>
          <HiddenInput
            id="banner-image-input"
            type="file"
            accept="image/*"
            onChange={handleChangeImage}
          />
        </InputGroup>

        <SaveBtn type="button" onClick={handleSave}>메인 배너 저장</SaveBtn>
      </EditForm>
    </Container>
  );
};

export default BannerManagement;

const Container = styled.div`
  padding: 24px;
  background: #f7f5f0;
  min-height: 100vh;
`;

const Title = styled.h2`
  font-size: 30px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 500;
  margin-bottom: 20px;
`;

const EditForm = styled.div`
  max-width: 800px;
  background: #fff;
  border: 1px solid #ece7de;
  padding: 30px;
  border-radius: 0;
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

const HelperText = styled.p`
  margin-top: -2px;
  margin-bottom: 8px;
  font-size: 12px;
  color: #888;
`;

const Input = styled.input`
  width: 100%;
  border: 1px solid #d9d9d9;
  padding: 10px 12px;
  font-size: 14px;
  background: #fff;
`;

const ImagePreviewBox = styled.div`
  width: 100%;
  height: 180px;
  border: 1px dashed #d9d9d9;
  color: #888;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const UploadBtn = styled.button`
  border: 1px solid #d9d9d9;
  background: #fff;
  font-size: 13px;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 0;
`;

const HiddenInput = styled.input`
  display: none;
`;

const SaveBtn = styled.button`
  width: 100%;
  padding: 16px;
  background: #333;
  color: #fff;
  border: none;
  font-weight: 600;
  margin-top: 10px;
  cursor: pointer;
`;
