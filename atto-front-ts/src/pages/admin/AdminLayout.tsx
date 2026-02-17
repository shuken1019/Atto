import React from 'react';
import styled from 'styled-components';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSalesPage = location.pathname.startsWith('/admin/sales');

  const handleLogout = () => {
    localStorage.removeItem('atto_auth');
    localStorage.removeItem('attoUser');
    window.dispatchEvent(new Event('auth-changed'));
    navigate('/');
  };

  return (
    <AdminWrapper>
      <Sidebar>
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

const Sidebar = styled.aside`
  width: 260px;
  background: #1a1a1a;
  color: #fff;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
`;

const LogoArea = styled(Link)`
  padding: 40px 30px;
  text-decoration: none;
  color: #fff;
`;

const HomeIcon = styled.svg`
  width: 24px;
  height: 24px;
  stroke: #fff;
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
  color: #888;
  padding: 15px 20px;
  font-size: 14px;
  border-radius: 8px;
  transition: all 0.3s;

  &.active {
    color: #fff;
    background: #333;
    font-weight: 600;
  }

  &:hover {
    color: #fff;
  }
`;

const AdminInfo = styled.div`
  padding: 30px;
  border-top: 1px solid #333;
  font-size: 13px;

  p {
    margin-bottom: 10px;
    color: #888;
  }

  strong {
    color: #fff;
  }

  button {
    background: none;
    border: none;
    color: #e74c3c;
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
  }
`;

const MainContent = styled.main<{ $isSalesPage: boolean }>`
  flex: 1;
  margin-left: 260px;
  padding: 40px;
  min-height: 100vh;
  background: ${(props) => (props.$isSalesPage ? '#fcfcfc' : '#f7f5f0')};
`;
