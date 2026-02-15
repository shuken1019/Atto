// src/components/layout/Header.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const Header: React.FC = () => {
  return (
    <HeaderWrapper>
      <Nav>
        <div className="left-menu">
          <MenuLink to="/shop">SHOP</MenuLink>
          <MenuLink to="/about">ABOUT</MenuLink>
        </div>

        {/* 🎨 핵심: 타원형 로고 디자인 */}
        <LogoContainer to="/">
          <LogoText>ATTO</LogoText>
        </LogoContainer>

        <div className="right-menu">
          <MenuLink to="/login">Login</MenuLink>
          <MenuLink to="/Mypage">Mypage</MenuLink>
        </div>
      </Nav>
    </HeaderWrapper>
  );
};

export default Header;

// --- 스타일 ---
const HeaderWrapper = styled.header`
  padding: 20px 40px;
  position: relative;
  z-index: 10;
`;

const Nav = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;

  .left-menu, .right-menu {
    display: flex;
    gap: 30px;
    flex: 1; /* 로고 중심으로 좌우 균형 맞추기 */
  }
  
  .right-menu {
    justify-content: flex-end;
  }
`;

const MenuLink = styled(Link)`
  font-size: 13px;
  letter-spacing: 1px;
  font-weight: 500;
  text-transform: uppercase;
  color: #333;
  &:hover { opacity: 0.6; }
`;

const LogoContainer = styled(Link)`
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const LogoText = styled.h1`
  font-size: 24px;
  letter-spacing: 2px;
  padding: 8px 24px;
  border: 1.5px solid #1A1A1A; /* 타원형 테두리 */
  border-radius: 50%; /* 둥글게 */
  /* 타원 모양을 억지로 만들기 위한 비율 조정 */
  display: inline-block;
  font-family: 'Playfair Display', serif;
`;