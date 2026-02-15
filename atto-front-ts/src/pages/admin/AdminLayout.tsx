//(관리자 전용 사이드바 +헤더 포함)
// src/pages/admin/AdminLayout.tsx
import React from 'react';
import styled from 'styled-components';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('atto_auth');
    window.dispatchEvent(new Event('auth-changed'));
    navigate('/');
  };

  return (
    <AdminWrapper>
      {/* 왼쪽 사이드바 */}
      <Sidebar>
        <LogoArea to="/">
          <LogoText>ADMIN</LogoText>
        </LogoArea>
        
        <NavMenu>
          <MenuLink to="/admin/dashboard">대시보드</MenuLink>
          <MenuLink to="/admin/products">상품 관리</MenuLink>
          <MenuLink to="/admin/upload">상품 업로드</MenuLink>
          <MenuLink to="/admin/orders">주문 및 배송</MenuLink>
          <MenuLink to="/admin/users">사용자 관리</MenuLink>
          <MenuLink to="/admin/banners">배너 관리</MenuLink>
        </NavMenu>

        <AdminInfo>
          <p><strong>관리자</strong>로 로그인됨</p>
          <button type="button" onClick={handleLogout}>
            로그아웃
          </button>
        </AdminInfo>
      </Sidebar>

      {/* 오른쪽 컨텐츠 영역 */}
      <MainContent>
        <Outlet /> {/* 여기에 각 하위 페이지들이 나옵니다 */}
      </MainContent>
    </AdminWrapper>
  );
};

export default AdminLayout;

// ---------- Styled Components ----------

const AdminWrapper = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #fcfcfc;
`;

const Sidebar = styled.aside`
  width: 260px;
  background-color: #1a1a1a; /* 관리자 느낌을 위해 차콜/블랙 계열 사용 */
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

const LogoText = styled.h1`
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 700;
  font-size: 22px;
  letter-spacing: 2px;
  border: 1px solid #fff;
  padding: 5px 15px;
  border-radius: 50px;
  text-align: center;
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
    background-color: #333;
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
  p { margin-bottom: 10px; color: #888; }
  strong { color: #fff; }
  button {
    background: none; border: none; color: #e74c3c; cursor: pointer; padding: 0;
    text-decoration: underline;
  }
`;

const MainContent = styled.main`
  flex: 1;
  margin-left: 260px; /* 사이드바 너비만큼 띄움 */
  padding: 40px;
`;
