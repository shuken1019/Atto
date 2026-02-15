// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { createGlobalStyle } from 'styled-components';
import Layout from './components/layout/Layout';
import Home from './pages/Home';

// 💅 1. 전역 스타일: ATTO 감성 주입
const GlobalStyle = createGlobalStyle`
  /* 구글 폰트에서 명조체(Playfair Display)와 고딕체 가져오기 */
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Noto+Sans+KR:wght@300;400;500&display=swap');

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  body {
    /* 🎨 핵심: 사진 속 그 베이지색 배경 */
    background-color: #F6F4EF; 
    color: #1A1A1A;
    font-family: 'Noto Sans KR', sans-serif; /* 기본 글씨는 고딕 */
    line-height: 1.6;
  }

  /* 제목들은 우아한 명조체로 */
  h1, h2, h3, h4, h5, h6 {
    font-family: 'Playfair Display', serif;
    font-weight: 400;
  }

  a {
    text-decoration: none;
    color: inherit;
  }
  
  button {
    font-family: inherit;
  }
`;

const App: React.FC = () => {
  return (
    <Router>
      <GlobalStyle />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;