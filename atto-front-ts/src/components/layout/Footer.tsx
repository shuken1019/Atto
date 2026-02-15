// src/components/layout/Footer.tsx

import React from 'react';
import styled from 'styled-components';

const Footer: React.FC = () => {
  return (
    <FooterContainer>
      <FooterInner>
        <FooterSection>
          <h3>ATTO</h3>
          <p>Natural comfort for your daily life.</p>
        </FooterSection>
        <FooterSection>
          <h4>Help</h4>
          <ul>
            <li><a href="/contact">Contact Us</a></li>
            <li><a href="/shipping">Shipping & Returns</a></li>
          </ul>
        </FooterSection>
        <FooterSection>
          <h4>Follow Us</h4>
          <ul>
            <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a></li>
          </ul>
        </FooterSection>
      </FooterInner>
      <Copyright>
        © {new Date().getFullYear()} ATTO. All rights reserved.
      </Copyright>
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
`;

const FooterInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 40px;
  margin-bottom: 40px;
`;

const FooterSection = styled.div`
  h3 {
    font-size: 24px;
    color: #333;
    margin-bottom: 16px;
    font-family: serif;
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