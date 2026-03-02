import React, { useState } from 'react';
import styled from 'styled-components';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSalesPage = location.pathname.startsWith('/admin/sales');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('atto_auth');
    localStorage.removeItem('attoUser');
    window.dispatchEvent(new Event('auth-changed'));
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <AdminWrapper>
      <TopBar>
        <MenuButton type="button" aria-label="메뉴 열기" onClick={() => setMenuOpen((v) => !v)}>
          <span />
          <span />
          <span />
        </MenuButton>
        <TopTitle>ADMIN</TopTitle>
      </TopBar>

      <Sidebar $open={menuOpen}>
        <LogoArea to="/">
          <HomeIcon viewBox="0 0 24 24" aria-label="홈으로 이동" role="img">
            <path d="M3 10.5 12 3l9 7.5" />
            <path d="M5 9.5V21h14V9.5" />
            <path d="M10 21v-6h4v6" />
          </HomeIcon>
        </LogoArea>

        <NavMenu>
          <MenuLink to="/admin/dashboard">대시보드</MenuLink>
          <MenuLink to="/admin/products">상품 관리</MenuLink>
          <MenuLink to="/admin/upload">상품 업로드</MenuLink>
          <MenuLink to="/admin/orders">주문 및 배송</MenuLink>
          <MenuLink to="/admin/sales">매출 관리</MenuLink>
          <MenuLink to="/admin/users">사용자 관리</MenuLink>
          <MenuLink to="/admin/banners">배너 관리</MenuLink>
        </NavMenu>

        <AdminInfo>
          <p>
            <strong>관리자</strong> 로 로그인됨
          </p>
          <button type="button" onClick={handleLogout}>
            로그아웃
          </button>
        </AdminInfo>
      </Sidebar>
      {menuOpen && <MobileBackdrop onClick={() => setMenuOpen(false)} />}

      <MainContent $isSalesPage={isSalesPage}>
        <Outlet />
      </MainContent>
    </AdminWrapper>
  );
};

export default AdminLayout;

const AdminWrapper = styled.div`
  display: flex;
  min-height: 100vh;
  background: #fcfcfc;
  font-family: 'Noto Sans KR', sans-serif;

  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  p,
  span,
  a,
  button,
  input,
  textarea,
  select,
  th,
  td,
  label {
    font-family: 'Noto Sans KR', sans-serif;
  }
`;

const Sidebar = styled.aside<{ $open: boolean }>`
  width: 260px;
  background: #f6f4ef;
  color: #1a1a1a;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  transition: transform 0.25s ease;
  transform: translateX(${(props) => (props.$open ? '0' : '-100%')});
  z-index: 120;
  box-shadow: ${(props) => (props.$open ? '8px 0 26px rgba(0, 0, 0, 0.14)' : 'none')};

  @media (min-width: 901px) {
    transform: translateX(0);
    box-shadow: 8px 0 26px rgba(0, 0, 0, 0.08);
  }
`;

const LogoArea = styled(Link)`
  padding: 40px 30px;
  text-decoration: none;
  color: #1a1a1a;
`;

const HomeIcon = styled.svg`
  width: 24px;
  height: 24px;
  stroke: #1a1a1a;
  stroke-width: 1.8;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
`;

const NavMenu = styled.nav`
  display: flex;
  flex-direction: column;
  padding: 0 20px;
  gap: 5px;
  flex: 1;
`;

const MenuLink = styled(NavLink)`
  text-decoration: none;
  color: #666;
  padding: 15px 20px;
  font-size: 14px;
  border-radius: 8px;
  transition: all 0.3s;

  &.active {
    color: #111;
    background: #ece7de;
    font-weight: 600;
  }

  &:hover {
    color: #111;
  }
`;

const AdminInfo = styled.div`
  padding: 30px;
  border-top: 1px solid #e3dfd5;
  font-size: 13px;

  p {
    margin-bottom: 10px;
    color: #666;
  }

  strong {
    color: #1a1a1a;
  }

  button {
    background: none;
    border: none;
    color: #c53030;
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
  }
`;

const MainContent = styled.main<{ $isSalesPage: boolean }>`
  flex: 1;
  margin-left: 0;
  padding: 40px;
  min-height: 100vh;
  background: ${(props) => (props.$isSalesPage ? '#fcfcfc' : '#f7f5f0')};

  @media (max-width: 900px) {
    padding: 20px 16px 60px;
  }

  @media (min-width: 901px) {
    margin-left: 260px;
  }
`;

const TopBar = styled.div`
  position: fixed;
  top: 14px;
  left: 14px;
  z-index: 130;
  display: none;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(246, 244, 239, 0.95);
  border: 1px solid #e3dfd5;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);

  @media (max-width: 900px) {
    display: inline-flex;
  }
`;

const MenuButton = styled.button`
  width: 38px;
  height: 34px;
  border: none;
  background: transparent;
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 6px;
  padding: 4px;
  cursor: pointer;

  span {
    width: 22px;
    height: 2px;
    background: #1a1a1a;
    border-radius: 1px;
  }
`;

const TopTitle = styled.span`
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 1px;
`;

const MobileBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 110;
`;
