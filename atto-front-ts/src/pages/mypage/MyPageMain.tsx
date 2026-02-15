import React from 'react';
import styled from 'styled-components';
import { NavLink, Outlet } from 'react-router-dom';

const MyPageMain: React.FC = () => {
  return (
    <Container>
      <HeaderArea>
        <h1>MY ACCOUNT</h1>
        <p>안녕하세요, <strong>김아토</strong>님.</p>
      </HeaderArea>
      
      <Layout>
        {/* 왼쪽 사이드 메뉴 */}
        <Sidebar>
          <MenuLink to="/mypage/edit">회원정보 수정</MenuLink>
          <MenuLink to="/mypage/scraps">스크랩 (Wishlist)</MenuLink>
          <MenuLink to="/mypage/shipping">배송지 관리</MenuLink>
          <MenuLink to="/mypage/orders">주문/결제 내역</MenuLink>
          <LogoutButton>로그아웃</LogoutButton>
        </Sidebar>

        {/* 오른쪽 컨텐츠 영역 (Outlet 부분에 하위 페이지가 나옴) */}
        <Content>
          <Outlet />
        </Content>
      </Layout>
    </Container>
  );
};

export default MyPageMain;

const Container = styled.div` max-width: 1200px; margin: 0 auto; padding: 60px 20px 100px; `;
const HeaderArea = styled.div` text-align: center; margin-bottom: 60px; h1 { font-family: 'Playfair Display', serif; font-size: 36px; margin-bottom: 10px; } p { color: #555; } strong { color: #1a1a1a; } `;
const Layout = styled.div` display: flex; gap: 60px; @media (max-width: 768px) { flex-direction: column; gap: 30px; } `;
const Sidebar = styled.nav` width: 220px; flex-shrink: 0; display: flex; flex-direction: column; gap: 10px; `;
const MenuLink = styled(NavLink)` text-decoration: none; color: #888; font-size: 15px; padding: 12px 0; border-bottom: 1px solid transparent; transition: all 0.2s; &.active { color: #1a1a1a; font-weight: 600; border-bottom-color: #1a1a1a; } &:hover { color: #1a1a1a; } `;
const LogoutButton = styled.button` text-align: left; background: none; border: none; color: #999; font-size: 14px; margin-top: 30px; cursor: pointer; padding: 0; &:hover { text-decoration: underline; } `;
const Content = styled.div` flex: 1; `;