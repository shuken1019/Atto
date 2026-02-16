import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const CartIcon = () => (
  <svg width="20" height="22" viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="6" width="18" height="15" stroke="#1A1A1A" strokeWidth="1.2" />
    <path d="M6 8V5C6 2.79086 7.79086 1 10 1V1C12.2091 1 14 2.79086 14 5V8" stroke="#1A1A1A" strokeWidth="1.2" />
  </svg>
);

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

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

  const handleLogout = () => {
    localStorage.removeItem('atto_auth');
    localStorage.removeItem('attoUser');
    window.dispatchEvent(new Event('auth-changed'));
    navigate('/');
  };

  return (
    <HeaderWrapper>
      <Nav>
        <div className="left-menu">
          <MenuLink to="/shop">SHOP</MenuLink>
          <IconButton to="/cart" aria-label="Cart">
            <CartIcon />
          </IconButton>
        </div>

        <LogoContainer to="/">
          <LogoText>ATTO</LogoText>
        </LogoContainer>

        <div className="right-menu">
          {isLoggedIn ? (
            <MenuButton type="button" onClick={handleLogout}>
              LOGOUT
            </MenuButton>
          ) : (
            <MenuLink to="/login">LOGIN</MenuLink>
          )}
          <MenuLink to="/mypage">MY PAGE</MenuLink>
          {isAdmin && <MenuLink to="/admin">ADMIN</MenuLink>}
        </div>
      </Nav>
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

  .left-menu,
  .right-menu {
    display: flex;
    align-items: center;
    gap: 30px;
    flex: 1;
  }

  .right-menu {
    justify-content: flex-end;
  }

  @media (max-width: 900px) {
    .left-menu,
    .right-menu {
      gap: 16px;
    }
  }

  @media (max-width: 640px) {
    flex-wrap: wrap;
    row-gap: 12px;

    .left-menu,
    .right-menu {
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

  &:hover {
    opacity: 0.6;
    transform: translateY(-1px);
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
`;

