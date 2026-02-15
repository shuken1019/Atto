import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

// 👜 ATTO 감성에 맞춘 미니멀 쇼핑백 아이콘
const CartIcon = () => (
  <svg width="20" height="22" viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 가방 몸체: 얇은 선으로 세련되게 */}
    <rect x="1" y="6" width="18" height="15" stroke="#1A1A1A" strokeWidth="1.2" />
    {/* 가방 손잡이: 부드러운 곡선 */}
    <path d="M6 8V5C6 2.79086 7.79086 1 10 1V1C12.2091 1 14 2.79086 14 5V8" stroke="#1A1A1A" strokeWidth="1.2" />
  </svg>
);

const Header: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const syncAuth = () => {
      const raw = localStorage.getItem('atto_auth');
      if (!raw) {
        setIsAdmin(false);
        return;
      }

      try {
        const parsed = JSON.parse(raw) as { role?: string };
        setIsAdmin(parsed.role === 'admin');
      } catch {
        setIsAdmin(false);
      }
    };

    syncAuth();
    window.addEventListener('storage', syncAuth);
    window.addEventListener('auth-changed', syncAuth);
    return () => {
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener('auth-changed', syncAuth);
    };
  }, []);

  return (
    <HeaderWrapper>
      <Nav>
        {/* 왼쪽 메뉴: SHOP과 새로운 가방 아이콘 */}
        <div className="left-menu">
          <MenuLink to="/shop">SHOP</MenuLink>
          <IconButton to="/cart" aria-label="Cart">
            <CartIcon />
          </IconButton>
        </div>

        {/* 중앙: ATTO 타원형 로고 */}
        <LogoContainer to="/">
          <LogoText>ATTO</LogoText>
        </LogoContainer>

        {/* 오른쪽 메뉴: 로그인과 마이페이지 */}
        <div className="right-menu">
          <MenuLink to="/login">LOGIN</MenuLink>
          <MenuLink to="/mypage">MY PAGE</MenuLink>
          {isAdmin && <MenuLink to="/admin">ADMIN</MenuLink>}
        </div>
      </Nav>
    </HeaderWrapper>
  );
};

export default Header;

// --- 스타일 정의 ---

const HeaderWrapper = styled.header`
  padding: 20px 40px;
  position: sticky;
  top: 0;
  background-color: #F6F4EF;
  z-index: 100;
  border-bottom: 1px solid rgba(26, 26, 26, 0.08);

  @media (max-width: 900px) {
    padding: 16px 20px;
  }

  @media (max-width: 640px) {
    padding: 12px 14px;
  }
`;

const Nav = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;

  .left-menu, .right-menu {
    display: flex;
    align-items: center;
    gap: 30px;
    flex: 1; 
  }
  
  .right-menu {
    justify-content: flex-end;
  }

  @media (max-width: 900px) {
    .left-menu, .right-menu {
      gap: 16px;
    }
  }

  @media (max-width: 640px) {
    flex-wrap: wrap;
    row-gap: 12px;

    .left-menu, .right-menu {
      flex: 1 1 50%;
      gap: 12px;
    }
  }
`;

const MenuLink = styled(Link)`
  font-size: 13px;
  letter-spacing: 1.5px;
  font-weight: 500;
  text-transform: uppercase;
  color: #333;
  transition: opacity 0.2s;
  
  &:hover { opacity: 0.5; }

  @media (max-width: 640px) {
    font-size: 11px;
    letter-spacing: 1px;
  }
`;

const IconButton = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1A1A1A;
  transition: transform 0.2s, opacity 0.2s;
  
  &:hover { 
    opacity: 0.6;
    transform: translateY(-1px); /* 살짝 떠오르는 효과 */
  }
`;

const LogoContainer = styled(Link)`
  text-align: center;

  @media (max-width: 640px) {
    order: -1;
    flex: 1 1 100%;
    display: flex;
    justify-content: center;
  }
`;

const LogoText = styled.h1`
  font-size: 24px;
  letter-spacing: 2px;
  padding: 8px 24px;
  border: 1.5px solid #1A1A1A; 
  border-radius: 50%;
  display: inline-block;
  font-family: 'Playfair Display', serif;
  color: #1A1A1A;
  line-height: 1;

  @media (max-width: 900px) {
    font-size: 20px;
    padding: 7px 20px;
  }

  @media (max-width: 640px) {
    font-size: 18px;
    padding: 6px 18px;
  }
`;
