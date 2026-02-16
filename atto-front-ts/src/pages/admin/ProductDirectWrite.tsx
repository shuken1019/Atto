import React, { useState } from 'react';
import styled from 'styled-components';

const toolItems = [
  { label: '사진', icon: 'image' },
  { label: '동영상', icon: 'video' },
  { label: '인용구', icon: 'quote' },
  { label: '구분선', icon: 'divider' },
  { label: '장소', icon: 'pin' },
  { label: '링크', icon: 'link' },
  { label: '표', icon: 'table' },
  { label: 'HTML', icon: 'html' },
];

const ProductDirectWrite: React.FC = () => {
  const [content, setContent] = useState('');
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  const libraryItems = [
    { category: '패션', title: '2 Color 스테이 카라 셔츠' },
    { category: '잡화', title: '3 way 백' },
    { category: '뷰티', title: '청담 익스트림 볼륨 마스카라' },
    { category: '리빙', title: '로비니아 원목 3단 서랍장' },
    { category: '푸드', title: '한라봉 선물용 3KG' },
    { category: '키즈', title: '에어자이저 핑크 유모차' },
  ];

  return (
    <Page>
      <TopBar>
        <BrandArea>
          <BrandBadge>A</BrandBadge>
          <BrandTextWrap>
            <BrandText>ATTO</BrandText>
            <BrandSubText>ADMIN EDITOR</BrandSubText>
          </BrandTextWrap>
        </BrandArea>
        <TopActions>
          <GhostButton type="button">저장 0</GhostButton>
          <PrimaryButton type="button">등록</PrimaryButton>
        </TopActions>
      </TopBar>

      <Toolbar>
        {toolItems.map((item) => (
          <ToolButton key={item.label} type="button">
            <ToolIcon aria-hidden="true">
              <ToolSvgIcon name={item.icon} />
            </ToolIcon>
            <ToolLabel>{item.label}</ToolLabel>
          </ToolButton>
        ))}
      </Toolbar>

      <SubToolbar>
        <SubTool type="button">본문</SubTool>
        <SubTool type="button">15</SubTool>
        <SubTool type="button">B</SubTool>
        <SubTool type="button">I</SubTool>
        <SubTool type="button">U</SubTool>
        <SubTool type="button">리스트</SubTool>
        <SubDivider />
        <SubTool type="button">T</SubTool>
        <SubTool type="button">T■</SubTool>
        <SubTool type="button">T</SubTool>
        <SubDivider />
        <SubTool type="button">☰</SubTool>
        <SubTool type="button">↕</SubTool>
        <SubTool type="button">☷</SubTool>
        <SubDivider />
        <SubTool type="button">🔗</SubTool>
        <SpellTool type="button">Aa 맞춤법</SpellTool>
      </SubToolbar>

      <EditorArea>
        <InsertCol>
          <InsertButton type="button">+</InsertButton>
        </InsertCol>
        <ContentCol>
          <EditorTextarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용을 입력하세요."
          />
        </ContentCol>
      </EditorArea>

      <RightDock>
        <DockButton type="button" $active={isLibraryOpen} onClick={() => setIsLibraryOpen((prev) => !prev)}>
          라이브러리
        </DockButton>
      </RightDock>

      {isLibraryOpen && (
        <>
          <DrawerBackdrop onClick={() => setIsLibraryOpen(false)} />
          <LibraryDrawer>
            <DrawerHeader>
              <h3>라이브러리</h3>
              <CloseButton type="button" onClick={() => setIsLibraryOpen(false)}>✕</CloseButton>
            </DrawerHeader>
            <DrawerSubHead>
              <span>추천 템플릿</span>
              <small>총 {libraryItems.length}개</small>
            </DrawerSubHead>
            <DrawerList>
              {libraryItems.map((item) => (
                <DrawerItem key={`${item.category}-${item.title}`}>
                  <DrawerThumb />
                  <DrawerMeta>
                    <strong>{item.category}</strong>
                    <p>{item.title}</p>
                  </DrawerMeta>
                </DrawerItem>
              ))}
            </DrawerList>
          </LibraryDrawer>
        </>
      )}
    </Page>
  );
};

export default ProductDirectWrite;

const ToolSvgIcon: React.FC<{ name: string }> = ({ name }) => {
  switch (name) {
    case 'image':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3.5" y="5" width="17" height="14" rx="2" />
          <circle cx="9" cy="10" r="1.5" />
          <path d="M5.5 17l4.2-4.2a1 1 0 011.4 0L14 15.7l1.8-1.8a1 1 0 011.4 0L20.5 17" />
        </svg>
      );
    case 'video':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3.5" y="6" width="12.5" height="12" rx="2" />
          <path d="M16 10l4.5-2.5v9L16 14z" />
        </svg>
      );
    case 'quote':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 16h5V9H7l-1 3zM14 16h5V9h-4l-1 3z" />
        </svg>
      );
    case 'divider':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 12h16" />
          <path d="M4 8h16M4 16h16" opacity="0.45" />
        </svg>
      );
    case 'pin':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 21s6-5.4 6-10a6 6 0 10-12 0c0 4.6 6 10 6 10z" />
          <circle cx="12" cy="11" r="2" />
        </svg>
      );
    case 'link':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M10 14l4-4" />
          <path d="M8.5 16.5l-2 2a3 3 0 104.2 4.2l2-2" />
          <path d="M15.5 7.5l2-2a3 3 0 10-4.2-4.2l-2 2" />
        </svg>
      );
    case 'table':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3.5" y="5" width="17" height="14" rx="1.5" />
          <path d="M3.5 10h17M3.5 14h17M9 5v14M15 5v14" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 6h5M4 18h5M15 6h5M15 18h5" />
          <path d="M9 4v16M15 4v16" />
        </svg>
      );
  }
};

const Page = styled.div`
  margin: -40px;
  min-height: 100vh;
  background: #fff;
  border: 1px solid #e5e7eb;
  position: relative;
`;

const TopBar = styled.div`
  height: 60px;
  padding: 0 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const BrandArea = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const BrandBadge = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #111827;
  color: #fff;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const BrandTextWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const BrandText = styled.span`
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: #1f2937;
`;

const BrandSubText = styled.span`
  font-size: 11px;
  color: #6b7280;
  letter-spacing: 0.5px;
`;

const TopActions = styled.div`
  display: flex;
  gap: 8px;
`;

const GhostButton = styled.button`
  height: 36px;
  padding: 0 14px;
  border: 1px solid #374151;
  background: #fff;
  color: #1f2937;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
`;

const PrimaryButton = styled.button`
  height: 36px;
  padding: 0 18px;
  border: 1px solid #111827;
  background: #111827;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
`;

const Toolbar = styled.div`
  min-height: 70px;
  padding: 8px 16px 10px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex-wrap: wrap;
`;

const ToolButton = styled.button`
  min-width: 72px;
  height: 56px;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: transparent;
  color: #4b5563;
  cursor: pointer;

  &:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
  }
`;

const ToolIcon = styled.span`
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid #c7ccd4;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1f2937;
  background: #fff;

  svg {
    width: 14px;
    height: 14px;
  }
`;

const ToolLabel = styled.span`
  font-size: 12px;
  line-height: 1;
  color: #4b5563;
`;

const SubToolbar = styled.div`
  min-height: 40px;
  padding: 6px 16px 7px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const SubTool = styled.button`
  min-width: 34px;
  height: 26px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  color: #4b5563;
  font-size: 13px;
  cursor: pointer;
`;

const SubDivider = styled.div`
  width: 1px;
  height: 20px;
  background: #e5e7eb;
  margin: 0 4px;
`;

const SpellTool = styled.button`
  height: 26px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  color: #4b5563;
  font-size: 13px;
  padding: 0 10px;
  cursor: pointer;
`;

const EditorArea = styled.div`
  min-height: calc(100vh - 171px);
  display: grid;
  grid-template-columns: 84px 1fr;
`;

const InsertCol = styled.div`
  border-right: 1px solid #e5e7eb;
  background: #fafafa;
  display: flex;
  justify-content: center;
  padding-top: 44px;
`;

const InsertButton = styled.button`
  width: 40px;
  height: 40px;
  border: 1px solid #d8dde5;
  background: #fff;
  color: #7a828f;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
`;

const ContentCol = styled.div`
  background: #fff;
`;

const EditorTextarea = styled.textarea`
  width: 100%;
  min-height: calc(100vh - 171px);
  border: none;
  resize: vertical;
  padding: 44px 44px;
  font-size: 20px;
  line-height: 1.9;
  color: #2b313b;

  &::placeholder {
    color: #98a1ad;
  }

  &:focus {
    outline: none;
  }
`;

const RightDock = styled.div`
  position: absolute;
  top: 72px;
  right: 20px;
  z-index: 20;
`;

const DockButton = styled.button<{ $active?: boolean }>`
  height: 36px;
  padding: 0 14px;
  border: 1px solid ${(props) => (props.$active ? '#111827' : '#d1d5db')};
  background: ${(props) => (props.$active ? '#111827' : '#fff')};
  color: ${(props) => (props.$active ? '#fff' : '#374151')};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
`;

const DrawerBackdrop = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(17, 24, 39, 0.15);
  z-index: 25;
`;

const LibraryDrawer = styled.aside`
  position: absolute;
  top: 0;
  right: 0;
  width: 360px;
  height: 100%;
  background: #fff;
  border-left: 1px solid #d1d5db;
  z-index: 30;
  display: flex;
  flex-direction: column;
`;

const DrawerHeader = styled.div`
  height: 72px;
  padding: 0 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 {
    font-size: 20px;
    font-weight: 700;
    color: #1f2937;
  }
`;

const CloseButton = styled.button`
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 20px;
  cursor: pointer;
`;

const DrawerSubHead = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;

  span {
    font-size: 14px;
    font-weight: 700;
    color: #111827;
  }

  small {
    font-size: 12px;
    color: #6b7280;
  }
`;

const DrawerList = styled.div`
  overflow: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const DrawerItem = styled.button`
  width: 100%;
  border: 1px solid #e5e7eb;
  background: #fff;
  padding: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  text-align: left;

  &:hover {
    border-color: #c7ccd4;
    background: #fafafa;
  }
`;

const DrawerThumb = styled.div`
  width: 74px;
  height: 74px;
  background: linear-gradient(135deg, #e5e7eb 0%, #f3f4f6 100%);
  border: 1px solid #dfe3ea;
`;

const DrawerMeta = styled.div`
  strong {
    display: block;
    font-size: 14px;
    color: #111827;
    margin-bottom: 3px;
  }

  p {
    font-size: 13px;
    color: #4b5563;
  }
`;
