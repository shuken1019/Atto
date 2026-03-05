import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { getBanner, saveBanner } from '../../services/bannerService';

const BannerManagement: React.FC = () => {
  const [mainText, setMainText] = useState('ESSENTIALS');
  const [seasonText, setSeasonText] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [pendingImageDataUrl, setPendingImageDataUrl] = useState<string | undefined>(undefined);
  const [pendingImageName, setPendingImageName] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getBanner()
      .then((banner) => {
        setMainText(banner.mainText ?? 'ESSENTIALS');
        setSeasonText(banner.seasonText ?? '');
        setImagePreview(banner.imageUrl ?? '');
        setPendingImageDataUrl(undefined);
        setPendingImageName(undefined);
      })
      .catch(() => {
        // ignore fetch errors, defaults already applied
      });
  }, []);

  const handleChangeImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setImagePreview(dataUrl);
      setPendingImageDataUrl(dataUrl);
      setPendingImageName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await saveBanner({
        mainText: mainText.trim(),
        seasonText: seasonText.trim(),
        imageDataUrl: pendingImageDataUrl,
        imageName: pendingImageName,
        imageUrl: pendingImageDataUrl ? undefined : imagePreview,
      });

      setMainText(saved.mainText);
      setSeasonText(saved.seasonText);
      setImagePreview(saved.imageUrl);
      setPendingImageDataUrl(undefined);
      setPendingImageName(undefined);
      alert('메인 배너 설정이 저장되었습니다.');
    } catch (error) {
      alert('배너 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container>
      <Title>메인 배너 관리</Title>

      <EditForm>
        <SectionTitle>상단 배너 설정</SectionTitle>
        <InputGroup>
          <Label>배너 메인 문구</Label>
          <Input placeholder="ex) ESSENTIALS" value={mainText} onChange={(e) => setMainText(e.target.value)} />
        </InputGroup>
        <InputGroup>
          <Label>시즌 문구</Label>
          <Input placeholder="ex) SPRING / SUMMER 2026" value={seasonText} onChange={(e) => setSeasonText(e.target.value)} />
        </InputGroup>
        <InputGroup>
          <Label>배너 이미지</Label>
          <HelperText>권장 사이즈: 1600 x 600px (JPG/PNG)</HelperText>
          <ImagePreviewBox>{imagePreview ? <img src={imagePreview} alt="배너 미리보기" /> : '현재 배너 이미지 없음'}</ImagePreviewBox>
          <UploadBtn as="label" htmlFor="banner-image-input">이미지 변경</UploadBtn>
          <HiddenInput id="banner-image-input" type="file" accept="image/*" onChange={handleChangeImage} />
        </InputGroup>

        <SaveBtn type="button" onClick={handleSave} disabled={saving}>{saving ? '저장 중...' : '메인 배너 저장'}</SaveBtn>
      </EditForm>
    </Container>
  );
};

export default BannerManagement;

const Container = styled.div`
  margin: -40px;
  padding: 24px;
  background: #f7f5f0;
  min-height: calc(100vh - 80px);
`;

const Title = styled.h2`
  font-size: 21px;
  font-family: 'Playfair Display', 'Noto Sans KR', sans-serif;
  font-weight: 500;
  margin-bottom: 14px;
`;

const EditForm = styled.div`
  max-width: 800px;
  background: #fff;
  border: 1px solid #ece7de;
  padding: 30px;
`;

const SectionTitle = styled.h4`
  margin-bottom: 20px;
  color: #1a1a1a;
  font-size: 18px;
  font-family: 'Playfair Display', 'Noto Sans KR', sans-serif;
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
  margin-bottom: 8px;
  font-size: 12px;
  color: #666;
`;

const Input = styled.input`
  width: 100%;
  border: 1px solid #ddd;
  padding: 10px 12px;
  font-size: 14px;
  background: #fff;
`;

const ImagePreviewBox = styled.div`
  width: 100%;
  min-height: 140px;
  border: 1px dashed #d4cfc5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  margin-bottom: 10px;

  img {
    width: 100%;
    height: auto;
    display: block;
  }
`;

const UploadBtn = styled.button`
  background: #fff;
  border: 1px solid #d9d9d9;
  padding: 8px 12px;
  cursor: pointer;
`;

const HiddenInput = styled.input`
  display: none;
`;

const SaveBtn = styled.button`
  border: none;
  background: #333;
  color: #fff;
  height: 44px;
  padding: 0 16px;
  cursor: pointer;
`;
