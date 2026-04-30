// src/components/layout/Footer.tsx

import React from 'react';
import styled from 'styled-components';

const SOCIAL_LINKS = {
  instagram: 'https://instagram.com',
  kakaoOpenChat: 'https://open.kakao.com',
  naver: 'https://www.naver.com',
};

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="4" y="4" width="16" height="16" rx="5" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="3.8" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
  </svg>
);

const KakaoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 3C6.9 3 3 6.2 3 10.2c0 2.5 1.5 4.7 3.8 6L6 21l4.2-2.3c.6.1 1.2.2 1.8.2 5.1 0 9-3.2 9-7.2S17.1 3 12 3Z"
      fill="currentColor"
    />
  </svg>
);

const NaverIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 5h4.2l5.6 8.4V5H19v14h-4.2l-5.6-8.4V19H5V5Z" fill="currentColor" />
  </svg>
);

const Footer: React.FC = () => {
  return (
    <FooterContainer>
      <FooterInner>
        <FooterSection>
          <h3>ATTO</h3>
          <p>사업자 등록번호 879-46-00149</p>
          <p>대표:이영주</p>
          <p>고객센터 번호: 010-2531-8341</p>
          <p>주소:서울특별시 강도구 풍성로54번길 47, 1층</p>
        </FooterSection>
        <FooterSection>
          <h4>Help</h4>
          <ul>
            <li><a href="/contact">이용약관</a></li>
            <li><a href="/shipping">개인정보 보호정책</a></li>
          </ul>
        </FooterSection>
        <FooterSection>
          <h4>Follow Us</h4>
          <FollowIconRow>
            <IconLink href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <InstagramIcon />
            </IconLink>
            <IconLink href={SOCIAL_LINKS.kakaoOpenChat} target="_blank" rel="noopener noreferrer" aria-label="Kakao Open Chat">
              <KakaoIcon />
            </IconLink>
            <IconLink href={SOCIAL_LINKS.naver} target="_blank" rel="noopener noreferrer" aria-label="Naver">
              <NaverIcon />
            </IconLink>
          </FollowIconRow>
        </FooterSection>
      </FooterInner>
      <Copyright>
        © {new Date().getFullYear()} ATTO. All rights reserved.
      </Copyright>
      <DesktopFloatingLinks>
        <IconLink href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
          <InstagramIcon />
        </IconLink>
        <IconLink href={SOCIAL_LINKS.kakaoOpenChat} target="_blank" rel="noopener noreferrer" aria-label="Kakao Open Chat">
          <KakaoIcon />
        </IconLink>
        <IconLink href={SOCIAL_LINKS.naver} target="_blank" rel="noopener noreferrer" aria-label="Naver">
          <NaverIcon />
        </IconLink>
      </DesktopFloatingLinks>
    </FooterContainer>
  );
};

// ⭐️ 중요: 이 줄이 꼭 있어야 합니다! ⭐️
export default Footer;

// ---------- Styled Components ----------

const FooterContainer = styled.footer`
  background-color: #f0ece6;
  padding: 60px 0 20px;
  color: #555;
  margin-top: auto;

  @media (max-width: 640px) {
    padding: 42px 0 16px;
  }
`;

const FooterInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 40px;
  margin-bottom: 40px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 28px;
    margin-bottom: 28px;
  }
`;

const FooterSection = styled.div`
  h3 {
    font-size: 24px;
    color: #333;
    margin-bottom: 16px;
    font-family: 'Playfair Display', serif;
  }
  h4 {
    font-size: 16px;
    color: #333;
    margin-bottom: 16px;
  }
  p {
    font-size: 14px;
    line-height: 1.6;
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  li {
    margin-bottom: 12px;
  }
  a {
    text-decoration: none;
    color: #555;
    font-size: 14px;
    transition: color 0.2s;
    &:hover {
      color: #333;
    }
  }
`;

const Copyright = styled.div`
  text-align: center;
  font-size: 12px;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
`;

const FollowIconRow = styled.div`
  display: none;
  align-items: center;
  gap: 10px;

  @media (max-width: 640px) {
    display: inline-flex;
  }
`;

const IconLink = styled.a`
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 1px solid rgba(26, 26, 26, 0.22);
  color: #1a1a1a;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, opacity 0.2s;

  &:hover {
    transform: translateY(-1px);
    opacity: 0.8;
  }
`;

const DesktopFloatingLinks = styled.div`
  position: fixed;
  right: 18px;
  bottom: 90px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 280;

  @media (max-width: 640px) {
    display: none;
  }
`;
