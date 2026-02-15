import React, { useMemo } from 'react';
import styled from 'styled-components';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

type StoredUser = {
  userId: number;
  id: string;
  email: string;
  name: string;
};

const MyPageMain: React.FC = () => {
  const navigate = useNavigate();

  const user = useMemo<StoredUser | null>(() => {
    try {
      const raw = localStorage.getItem('attoUser');
      if (!raw) return null;
      return JSON.parse(raw) as StoredUser;
    } catch {
      return null;
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('attoUser');
    navigate('/login');
  };

  const handleWithdraw = () => {
    const confirmed = window.confirm('정말 회원탈퇴 하시겠습니까?');
    if (!confirmed) return;
    alert('회원탈퇴 요청이 접수되었습니다.');
  };

  return (
    <Container>
      <HeaderArea>
        <h1>MY ACCOUNT</h1>
        <p>
          안녕하세요 <strong>{user?.name ?? '고객'}</strong>님
        </p>
      </HeaderArea>

      <Layout>
        <Sidebar>
          <MenuLink to="/mypage/edit">회원정보 수정</MenuLink>
          <MenuLink to="/mypage/scraps">스크랩 (Wishlist)</MenuLink>
          <MenuLink to="/mypage/shipping">배송지 관리</MenuLink>
          <MenuLink to="/mypage/orders">주문/결제 내역</MenuLink>
          <LogoutButton type="button" onClick={handleLogout}>
            로그아웃
          </LogoutButton>
          <WithdrawButton type="button" onClick={handleWithdraw}>
            회원탈퇴
          </WithdrawButton>
        </Sidebar>

        <Content>
          <Outlet />
        </Content>
      </Layout>
    </Container>
  );
};

export default MyPageMain;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 20px 100px;
`;

const HeaderArea = styled.div`
  text-align: center;
  margin-bottom: 60px;

  h1 {
    font-family: 'Playfair Display', serif;
    font-size: 36px;
    margin-bottom: 10px;
  }

  p {
    color: #555;
  }

  strong {
    color: #1a1a1a;
  }
`;

const Layout = styled.div`
  display: flex;
  gap: 60px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 30px;
  }
`;

const Sidebar = styled.nav`
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const MenuLink = styled(NavLink)`
  text-decoration: none;
  color: #888;
  font-size: 15px;
  padding: 12px 0;
  border-bottom: 1px solid transparent;
  transition: all 0.2s;

  &.active {
    color: #1a1a1a;
    font-weight: 600;
    border-bottom-color: #1a1a1a;
  }

  &:hover {
    color: #1a1a1a;
  }
`;

const LogoutButton = styled.button`
  text-align: left;
  background: none;
  border: none;
  color: #999;
  font-size: 14px;
  margin-top: 30px;
  cursor: pointer;
  padding: 0;

  &:hover {
    text-decoration: underline;
  }
`;

const WithdrawButton = styled.button`
  text-align: left;
  background: none;
  border: none;
  color: #c44c4c;
  font-size: 14px;
  margin-top: 8px;
  cursor: pointer;
  padding: 0;

  &:hover {
    text-decoration: underline;
    color: #b03838;
  }
`;

const Content = styled.div`
  flex: 1;
`;
