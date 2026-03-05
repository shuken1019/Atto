import React, { useMemo } from 'react';
import styled from 'styled-components';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { showConfirm } from '../../components/common/appDialog';
import { API_BASE_URL } from '../../config/api';

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

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // ignore logout network error, client state still clears
    }
    localStorage.removeItem('attoUser');
    localStorage.removeItem('atto_auth');
    window.dispatchEvent(new Event('auth-changed'));
    navigate('/login');
  };

  const handleWithdraw = () => {
    const run = async () => {
      const confirmed = await showConfirm('정말 회원탈퇴 하시겠습니까?');
      if (!confirmed) return;
      if (!user?.userId) {
        alert('로그인 정보가 없습니다. 다시 로그인해주세요.');
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/users/${user.userId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result?.ok) {
          alert(result?.message ?? '회원탈퇴에 실패했습니다.');
          return;
        }

        localStorage.removeItem('attoUser');
        localStorage.removeItem('atto_auth');
        window.dispatchEvent(new Event('auth-changed'));
        alert('회원탈퇴가 완료되었습니다.');
        navigate('/');
      } catch {
        alert('서버 연결에 실패했습니다.');
      }
    };
    void run();
  };

  return (
    <Container>
      <HeaderArea>
        <h1>마이페이지</h1>
        <p>
          안녕하세요 <strong>{user?.name ?? '고객'}</strong>님
        </p>
      </HeaderArea>

      <MobileQuickMenu>
        <MobileQuickLink to="/mypage/edit">회원정보 수정</MobileQuickLink>
        <MobileQuickLink to="/mypage/scraps">스크랩</MobileQuickLink>
        <MobileQuickLink to="/mypage/shipping">배송지 관리</MobileQuickLink>
        <MobileQuickLink to="/mypage/orders">주문/결제 내역</MobileQuickLink>
      </MobileQuickMenu>

      <Layout>
        <Sidebar>
          <MenuLink to="/mypage/edit">회원정보 수정</MenuLink>
          <MenuLink to="/mypage/scraps">스크랩 </MenuLink>
          <MenuLink to="/mypage/shipping">배송지 관리</MenuLink>
          <MenuLink to="/mypage/orders">주문/결제 내역</MenuLink>
        </Sidebar>

        <Content>
          <Outlet />
        </Content>
      </Layout>

      <FooterActions>
        <LogoutButton type="button" onClick={handleLogout}>
          로그아웃
        </LogoutButton>
        <WithdrawButton type="button" onClick={handleWithdraw}>
          회원탈퇴
        </WithdrawButton>
      </FooterActions>
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

  @media (max-width: 768px) {
    margin-bottom: 20px;
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

  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileQuickMenu = styled.nav`
  display: none;

  @media (max-width: 768px) {
    display: grid;
    grid-template-columns: repeat(2, minmax(120px, 1fr));
    gap: 10px;
    max-width: 460px;
    margin: 0 auto 24px;
  }
`;

const MobileQuickLink = styled(NavLink)`
  text-decoration: none;
  color: #555;
  background: #fff;
  border: 1px solid #e7e4db;
  border-radius: 12px;
  padding: 12px 10px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;

  &.active {
    color: #111;
    border-color: #d8d0c2;
    background: #f1ece3;
  }
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
  color: #555;
  font-size: 14px;
  cursor: pointer;
  padding: 10px 0;

  &:hover {
    text-decoration: underline;
  }
`;

const WithdrawButton = styled.button`
  text-align: left;
  background: none;
  border: none;
  color: #999;
  font-size: 14px;
  cursor: pointer;
  padding: 10px 0;

  &:hover {
    text-decoration: underline;
    color: #999;
  }
`;

const Content = styled.div`
  flex: 1;
`;

const FooterActions = styled.div`
  margin-top: 60px;
  border-top: 1px solid #eee;
  padding-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;
