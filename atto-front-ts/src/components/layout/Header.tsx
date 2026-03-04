import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const CartIcon = () => (
  <svg width="20" height="22" viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="6" width="18" height="15" stroke="#1A1A1A" strokeWidth="1.2" />
    <path d="M6 8V5C6 2.79086 7.79086 1 10 1V1C12.2091 1 14 2.79086 14 5V8" stroke="#1A1A1A" strokeWidth="1.2" />
  </svg>
);

const MyPageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="6" r="3.2" stroke="#1A1A1A" strokeWidth="1.2" />
    <path d="M3.5 17C3.9 13.8 6.5 12 10 12C13.5 12 16.1 13.8 16.5 17" stroke="#1A1A1A" strokeWidth="1.2" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 3H4.5C3.7 3 3 3.7 3 4.5V15.5C3 16.3 3.7 17 4.5 17H8" stroke="#1A1A1A" strokeWidth="1.2" />
    <path d="M11 6L16 10L11 14" stroke="#1A1A1A" strokeWidth="1.2" />
    <path d="M7 10H16" stroke="#1A1A1A" strokeWidth="1.2" />
  </svg>
);

const LoginIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3H15.5C16.3 3 17 3.7 17 4.5V15.5C17 16.3 16.3 17 15.5 17H12" stroke="#1A1A1A" strokeWidth="1.2" />
    <path d="M9 6L14 10L9 14" stroke="#1A1A1A" strokeWidth="1.2" />
    <path d="M3 10H14" stroke="#1A1A1A" strokeWidth="1.2" />
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
          <LeftDesktopNav>
            <MenuLink to="/shop">SHOP</MenuLink>
            <IconButton to="/cart" aria-label="Cart">
              <CartIcon />
            </IconButton>
          </LeftDesktopNav>
        </LeftArea>

        <LogoContainer to="/">
          <LogoText>ATTO</LogoText>
        </LogoContainer>

        <RightArea>
          <RightIconLink className="desktop-only" to="/mypage" aria-label="My Page">
            <MyPageIcon />
          </RightIconLink>
          {isLoggedIn ? (
            <>
              <Divider className="desktop-only" aria-hidden="true" />
              <RightIconButton className="desktop-only" type="button" onClick={handleLogout} aria-label="Logout">
                <LogoutIcon />
              </RightIconButton>
              {isAdmin && (
                <>
                  <Divider className="desktop-only" aria-hidden="true" />
                  <AdminMenuLink className="desktop-only" to="/admin">ADMIN</AdminMenuLink>
                </>
              )}
            </>
          ) : (
            <>
              <Divider className="desktop-only" aria-hidden="true" />
              <RightIconLink className="desktop-only" to="/login" aria-label="Login">
                <LoginIcon />
              </RightIconLink>
            </>
          )}
          {isLoggedIn ? (
            <MobileAuthButton type="button" onClick={handleLogout}>
              LOGOUT
            </MobileAuthButton>
          ) : (
            <MobileAuthLink to="/login">LOGIN</MobileAuthLink>
          )}
        </RightArea>
      </Nav>

      {isMenuOpen && (
        <>
          <MobileMenu>
            <MobileMenuNav>
              <MobileMenuItem to="/shop">SHOP</MobileMenuItem>
              <MobileMenuItem to="/cart">CART</MobileMenuItem>
              {isAdmin && <MobileMenuItem to="/admin">ADMIN</MobileMenuItem>}
              <MobileMenuItem to="/mypage">MY PAGE</MobileMenuItem>
              
            </MobileMenuNav>

            <MobileMenuFooter>
              <MobileMenuItem to="/login">LOGIN</MobileMenuItem>
            </MobileMenuFooter>
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
  position: relative;
  min-height: 56px;

  @media (max-width: 640px) {
    gap: 8px;
    min-height: 44px;
  }
`;

const LeftArea = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  position: relative;
  z-index: 2;
`;

const LeftDesktopNav = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;

  @media (max-width: 740px) {
    display: none;
  }
`;

const RightArea = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  position: relative;
  z-index: 2;

  .desktop-only {
    @media (max-width: 740px) {
      display: none;
    }
  }
`;

const MobileAuthLink = styled(Link)`
  display: none;
  font-size: 12px;
  letter-spacing: 1px;
  font-weight: 600;
  color: #333;

  @media (max-width: 740px) {
    display: inline-flex;
    align-items: center;
  }
`;

const MobileAuthButton = styled.button`
  display: none;
  font-size: 12px;
  letter-spacing: 1px;
  font-weight: 600;
  color: #333;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;

  @media (max-width: 740px) {
    display: inline-flex;
    align-items: center;
  }
`;

const RightIconLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: #1a1a1a;
  transition: opacity 0.2s, transform 0.2s;

  &:hover {
    opacity: 0.7;
    transform: translateY(-1px);
  }
`;

const RightIconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: #1a1a1a;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.2s;

  &:hover {
    opacity: 0.7;
    transform: translateY(-1px);
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

const AdminMenuLink = styled(MenuLink)`
  color: #c53030;

  &:hover {
    opacity: 0.8;
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

const Divider = styled.span`
  width: 1px;
  height: 14px;
  background: rgba(26, 26, 26, 0.25);
  display: inline-block;
`;

const LogoContainer = styled(Link)`
  text-align: center;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: inline-flex;
  justify-content: center;
  z-index: 1;
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
  width: 78vw;
  max-width: 340px;
  height: 100vh;
  background: #f6f4ef;
  box-shadow: 8px 0 26px rgba(0, 0, 0, 0.16);
  padding: 78px 18px 22px;
  display: flex;
  flex-direction: column;
  z-index: 200;
`;

const MobileMenuNav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
`;

const MobileMenuItem = styled(NavLink)`
  font-size: 15px;
  font-weight: 600;
  color: #666;
  padding: 15px 16px;
  border-radius: 10px;
  letter-spacing: 0.3px;
  transition: all 0.2s ease;

  &.active {
    color: #111;
    background: #ece7de;
  }

  &:hover {
    color: #111;
  }
`;

const MobileMenuFooter = styled.div`
  border-top: 1px solid #e3dfd5;
  padding: 18px 6px 0;
`;

const MobileBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 190;
`;
