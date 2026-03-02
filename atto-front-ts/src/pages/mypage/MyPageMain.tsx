import React, { useMemo, useState } from 'react';
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
  const [menuOpen, setMenuOpen] = useState(false);

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
    localStorage.removeItem('atto_auth');
    window.dispatchEvent(new Event('auth-changed'));
    navigate('/login');
    setMenuOpen(false);
  };

  const handleWithdraw = () => {
    const confirmed = window.confirm('정말 회원탈퇴 하시겠습니까?');
    if (!confirmed) return;
    alert('회원탈퇴 요청이 접수되었습니다.');
    setMenuOpen(false);
  };

  return (
    <Container>
      <HeaderArea>
        <h1>MY Page</h1>
        <p>
          안녕하세요 <strong>{user?.name ?? '고객'}</strong>님
        </p>
      </HeaderArea>

      <MobileMenuToggle type="button" onClick={() => setMenuOpen((v) => !v)}>
        <span />
        <span />
        <span />
        <strong>MY MENU</strong>
      </MobileMenuToggle>

      {menuOpen && (
        <>
          <MobileMenu>
            <MobileMenuLink to="/mypage/edit" onClick={() => setMenuOpen(false)}>회원정보 수정</MobileMenuLink>
            <MobileMenuLink to="/mypage/scraps" onClick={() => setMenuOpen(false)}>스크랩</MobileMenuLink>
            <MobileMenuLink to="/mypage/shipping" onClick={() => setMenuOpen(false)}>배송지 관리</MobileMenuLink>
            <MobileMenuLink to="/mypage/orders" onClick={() => setMenuOpen(false)}>주문/결제 내역</MobileMenuLink>
          </MobileMenu>
          <MobileBackdrop onClick={() => setMenuOpen(false)} />
        </>
      )}

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

const MobileMenuToggle = styled.button`
  display: none;
  width: 100%;
  margin: 0 auto 10px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  font-weight: 700;
  color: #1a1a1a;
  cursor: pointer;

  span {
    width: 18px;
    height: 2px;
    background: #1a1a1a;
    border-radius: 1px;
  }

  @media (max-width: 768px) {
    display: flex;
  }
`;

const MobileMenu = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 74vw;
  max-width: 320px;
  height: 100vh;
  background: #fff;
  box-shadow: 8px 0 26px rgba(0, 0, 0, 0.12);
  padding: 70px 22px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 120;
`;

const MobileMenuLink = styled(NavLink)`
  font-size: 14px;
  color: #1a1a1a;
  font-weight: 600;
  padding: 10px 0;
  text-decoration: none;

  &.active {
    color: #111;
  }
`;

const MobileBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 110;
`;
