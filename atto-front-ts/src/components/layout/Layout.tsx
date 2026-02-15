// src/components/layout/Layout.tsx (이 코드가 정답입니다!)

import React from 'react';
import styled from 'styled-components';
import Header from './Header';
import Footer from './Footer';

// ⭐️ 중요: 이 인터페이스가 반드시 있어야 합니다! ⭐️
interface LayoutProps {
  children: React.ReactNode; // children을 받겠다고 명시
}

// ⭐️ 중요: React.FC<LayoutProps> 타입을 사용하고, children을 props로 받아야 합니다! ⭐️
const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <LayoutContainer>
      <Header />
      <MainContent>{children}</MainContent>
      <Footer />
    </LayoutContainer>
  );
};

export default Layout;

// ---------- Styled Components ----------

const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  /* App.tsx GlobalStyle에서 배경색을 지정했으므로 여기선 제거해도 됩니다. */
  /* background-color: #f8f5ef; */
`;

const MainContent = styled.main`
  flex: 1;
`;