import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const CartIcon = () => (
  <svg width="20" height="22" viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="6" width="18" height="15" stroke="#1A1A1A" strokeWidth="1.2" />
    <path d="M6 8V5C6 2.79086 7.79086 1 10 1V1C12.2091 1 14 2.79086 14 5V8" stroke="#1A1A1A" strokeWidth="1.2" />
  </svg>
);

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const syncAuth = () => {
      const rawAuth = localStorage.getItem('atto_auth');
      const rawUser = localStorage.getItem('attoUser');
      let nextIsAdmin = false;
      let nextIsLoggedIn = false;

      try {
        const parsedAuth = rawAuth ? (JSON.parse(rawAuth) as { role?: string; userId?: number }) : null;
        const parsedUser = rawUser ? (JSON.parse(rawUser) as { role?: string; userId?: number }) : null;
        const role = String(parsedAuth?.role ?? parsedUser?.role ?? '').toUpperCase();

        nextIsAdmin = role === 'ADMIN';
        nextIsLoggedIn = Boolean(parsedAuth?.userId || parsedUser?.userId);
      } catch {
        nextIsAdmin = false;
        nextIsLoggedIn = false;
      }

      setIsAdmin(nextIsAdmin);
      setIsLoggedIn(nextIsLoggedIn);
    };

    syncAuth();
    window.addEventListener('storage', syncAuth);
    window.addEventListener('auth-changed', syncAuth);
    return () => {
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener('auth-changed', syncAuth);
    };
  }, []);

  useEffect(() => {
    // 라우트 변경 시 모바일 메뉴 닫기
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('atto_auth');
    localStorage.removeItem('attoUser');
    window.dispatchEvent(new Event('auth-changed'));
    navigate('/');
  };

  return (
    <HeaderWrapper>
      <Nav>
        <LeftArea>
          <MobileMenuButton
            type="button"
            aria-label="메뉴 열기"
            onClick={() => setIsMenuOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </MobileMenuButton>
        </LeftArea>

        <LogoContainer to="/">
          <LogoText>ATTO</LogoText>
        </LogoContainer>

        <RightArea>
          <MenuLink to="/shop">SHOP</MenuLink>
          <IconButton to="/cart" aria-label="Cart">
            <CartIcon />
          </IconButton>
          <MenuLink className="desktop-only" to="/mypage">MY PAGE</MenuLink>
          {isAdmin && <MenuLink className="desktop-only" to="/admin">ADMIN</MenuLink>}
          {isLoggedIn ? (
            <MenuButton className="desktop-only" type="button" onClick={handleLogout}>
              LOGOUT
            </MenuButton>
          ) : (
            <MenuLink className="desktop-only" to="/login">LOGIN</MenuLink>
          )}
        </RightArea>
      </Nav>

      {isMenuOpen && (
        <>
          <MobileMenu>
            <MobileMenuItem to="/shop">SHOP</MobileMenuItem>
            <MobileMenuItem to="/cart">CART</MobileMenuItem>
            <MobileMenuItem to="/mypage">MY PAGE</MobileMenuItem>
            {isAdmin && <MobileMenuItem to="/admin">ADMIN</MobileMenuItem>}
            {isLoggedIn ? (
              <MobileMenuButtonText type="button" onClick={handleLogout}>LOGOUT</MobileMenuButtonText>
            ) : (
              <MobileMenuItem to="/login">LOGIN</MobileMenuItem>
            )}
          </MobileMenu>
          <MobileBackdrop onClick={() => setIsMenuOpen(false)} />
        </>
      )}
    </HeaderWrapper>
  );
};

export default Header;

const HeaderWrapper = styled.header`
  padding: 20px 40px;
  position: sticky;
  top: 0;
  background-color: #f6f4ef;
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

  @media (max-width: 640px) {
    gap: 8px;
  }
`;

const LeftArea = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const RightArea = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;

  .desktop-only {
    @media (max-width: 740px) {
      display: none;
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

  &:hover {
    opacity: 0.5;
  }

  @media (max-width: 640px) {
    font-size: 11px;
    letter-spacing: 1px;
  }
`;

const MenuButton = styled.button`
  font-size: 13px;
  letter-spacing: 1.5px;
  font-weight: 500;
  text-transform: uppercase;
  color: #333;
  transition: opacity 0.2s;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;

  &:hover {
    opacity: 0.5;
  }

  @media (max-width: 640px) {
    font-size: 11px;
    letter-spacing: 1px;
  }
`;

const IconButton = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1a1a1a;
  transition: transform 0.2s, opacity 0.2s;
  padding: 6px;

  &:hover {
    opacity: 0.7;
    transform: translateY(-1px);
  }
`;

const LogoContainer = styled(Link)`
  text-align: center;

  @media (max-width: 640px) {
    display: flex;
    justify-content: center;
  }
`;

const LogoText = styled.h1`
  font-size: 24px;
  letter-spacing: 2px;
  padding: 8px 24px;
  border: 1.5px solid #1a1a1a;
  border-radius: 50%;
  display: inline-block;
  font-family: 'Playfair Display', serif;
  color: #1a1a1a;
  line-height: 1;

  @media (max-width: 900px) {
    font-size: 20px;
    padding: 7px 20px;
  }

  @media (max-width: 640px) {
    font-size: 18px;
    padding: 6px 18px;
  }

  @media (max-width: 740px) {
    font-size: 17px;
    padding: 6px 16px;
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  width: 38px;
  height: 34px;
  border: none;
  background: transparent;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 6px;
  padding: 4px;
  cursor: pointer;

  span {
    width: 22px;
    height: 2px;
    background: #1a1a1a;
    border-radius: 1px;
  }

  @media (max-width: 740px) {
    display: inline-flex;
  }
`;

const MobileMenu = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 72vw;
  max-width: 320px;
  height: 100vh;
  background: #f6f4ef;
  box-shadow: 8px 0 26px rgba(0, 0, 0, 0.16);
  padding: 70px 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  z-index: 200;
`;

const MobileMenuItem = styled(Link)`
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  padding: 10px 0;
`;

const MobileMenuButtonText = styled.button`
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  padding: 10px 0;
  background: none;
  border: none;
  text-align: left;
`;

const MobileBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 190;
`;
