// src/components/layout/Layout.tsx (이 코드가 정답입니다!)

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import Header from './Header';
import Footer from './Footer';

// ⭐️ 중요: 이 인터페이스가 반드시 있어야 합니다! ⭐️
interface LayoutProps {
  children: React.ReactNode; // children을 받겠다고 명시
}

// ⭐️ 중요: React.FC<LayoutProps> 타입을 사용하고, children을 props로 받아야 합니다! ⭐️
const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const [showTopButton, setShowTopButton] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowTopButton(window.scrollY > 320);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const handleTopClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <LayoutContainer>
      {!isAdminRoute && <Header />}
      <MainContent>{children}</MainContent>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && showTopButton && (
        <TopButton type="button" onClick={handleTopClick} aria-label="맨 위로 이동">
          ATTO
        </TopButton>
      )}
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

const TopButton = styled.button`
  position: fixed;
  right: 20px;
  bottom: 28px;
  padding: 8px 24px;
  border-radius: 50%;
  border: 1.5px solid #1a1a1a;
  background: transparent;
  color: #1a1a1a;
  font-size: 24px;
  font-weight: 400;
  letter-spacing: 2px;
  font-family: 'Playfair Display', serif;
  line-height: 1;
  cursor: pointer;
  z-index: 300;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.12);
  transition: transform 0.2s ease, opacity 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }

  @media (max-width: 640px) {
    right: 14px;
    bottom: 18px;
    padding: 6px 18px;
    font-size: 18px;
  }
`;
