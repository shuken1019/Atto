import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const ProductHtmlWrite: React.FC = () => {
  const [htmlValue, setHtmlValue] = useState('');
  const navigate = useNavigate();

  return (
    <Page>
      <AIBanner type="button">AI와 함께 상품설명을 만들어 보세요. Beta</AIBanner>

      <SectionCard>
        <SectionHeader>
          <SectionTitle>
            상세설명 <RequiredDot>•</RequiredDot>
          </SectionTitle>
          <FoldButton type="button">⌃</FoldButton>
        </SectionHeader>

        <EditorFrame>
          <TabRow>
            <TabButton type="button" onClick={() => navigate('/admin/upload/direct-write')}>직접 작성</TabButton>
            <TabButton type="button" $active>HTML 작성</TabButton>
          </TabRow>

          <HtmlCanvas>
            <HtmlTextarea
              value={htmlValue}
              onChange={(e) => setHtmlValue(e.target.value)}
              placeholder=""
            />
          </HtmlCanvas>

          <BottomRow>
            <NoticeBox>
              <WarnLine>외부 링크(네이버 폼 등)를 통한 개인정보(휴대폰 번호, 이메일 주소) 수집은 금지되므로 등록시 노출이 제재될 수 있습니다.</WarnLine>
              <WarnLine>http 이미지가 제대로 표시되지 않을 수 있습니다. https 이미지로 등록해 주세요.</WarnLine>
              <SafeLine>상품명과 직접적 관련 없는 상세설명, 외부 링크 입력 시 관리자에 의해 판매 금지 될 수 있습니다.</SafeLine>
              <SafeLine>안전거래정책에 위배될 경우 관리자에 의해 제재조치가 있을 수 있습니다.</SafeLine>
              <SafeLine>네이버 이외의 외부링크, 일부 스크립트 및 태그는 자동 삭제될 수 있습니다.</SafeLine>
              <SafeLine>상세설명 권장 크기 : 가로 860px</SafeLine>
            </NoticeBox>

            <RightActions>
              <PreviewActions>
                <PreviewButton type="button">PC 미리보기</PreviewButton>
                <PreviewButton type="button">모바일 미리보기</PreviewButton>
              </PreviewActions>
              <ConvertButton type="button">SmartEditor ONE 으로 변환하기 (1회성)</ConvertButton>
            </RightActions>
          </BottomRow>
        </EditorFrame>
      </SectionCard>
    </Page>
  );
};

export default ProductHtmlWrite;

const Page = styled.div`
  margin: -40px;
  min-height: 100vh;
  background: #f1f4f8;
  padding: 28px;
`;

const AIBanner = styled.button`
  border: 1px solid #b8c2ff;
  background: #eef2ff;
  color: #374151;
  height: 48px;
  padding: 0 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
`;

const SectionCard = styled.div`
  margin-top: 12px;
  border: 1px solid #d8dee8;
  background: #fff;
`;

const SectionHeader = styled.div`
  height: 82px;
  border-bottom: 1px solid #d8dee8;
  padding: 0 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SectionTitle = styled.h2`
  font-size: 17px;
  color: #1f2937;
  font-weight: 700;
`;

const RequiredDot = styled.span`
  color: #ef4444;
`;

const FoldButton = styled.button`
  width: 52px;
  height: 52px;
  border: 1px solid #cbd3df;
  background: #fff;
  color: #7a8597;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
`;

const EditorFrame = styled.div`
  padding: 60px 22px 22px;
`;

const TabRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  border: 1px solid #d8dee8;
  border-bottom: none;
`;

const TabButton = styled.button<{ $active?: boolean }>`
  height: 72px;
  border: none;
  border-right: 1px solid #d8dee8;
  background: ${(props) => (props.$active ? '#fff' : '#eef1f5')};
  color: ${(props) => (props.$active ? '#111827' : '#6b7280')};
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  position: relative;

  ${(props) =>
    props.$active &&
    `
      &::after {
        content: '';
        position: absolute;
        left: 50%;
        bottom: 0;
        width: 88px;
        height: 2px;
        background: #111827;
        transform: translateX(-50%);
      }
    `}

  &:last-child {
    border-right: none;
  }
`;

const HtmlCanvas = styled.div`
  min-height: 540px;
  border: 1px solid #d8dee8;
`;

const HtmlTextarea = styled.textarea`
  width: 100%;
  min-height: 540px;
  border: none;
  resize: vertical;
  padding: 18px;
  font-size: 14px;
  line-height: 1.7;
  font-family: 'SFMono-Regular', Menlo, Consolas, monospace;

  &:focus {
    outline: none;
  }
`;

const BottomRow = styled.div`
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  gap: 16px;

  @media (max-width: 1080px) {
    flex-direction: column;
  }
`;

const NoticeBox = styled.div`
  flex: 1;
`;

const WarnLine = styled.p`
  color: #ef4444;
  font-size: 13px;
  line-height: 1.6;
`;

const SafeLine = styled.p`
  color: #374151;
  font-size: 13px;
  line-height: 1.6;
`;

const RightActions = styled.div`
  width: 430px;
  max-width: 100%;
`;

const PreviewActions = styled.div`
  display: flex;
  gap: 8px;
`;

const PreviewButton = styled.button`
  flex: 1;
  height: 58px;
  border: 1px solid #111827;
  background: #111827;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
`;

const ConvertButton = styled.button`
  width: 100%;
  height: 58px;
  margin-top: 8px;
  border: 1px solid #cfd6e0;
  background: #fff;
  color: #1f2937;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
`;
