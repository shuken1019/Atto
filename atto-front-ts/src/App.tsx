// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { createGlobalStyle } from 'styled-components';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Shop from './pages/Shop'; // import는 이미 잘 되어 있습니다.
import ProductDetail from './pages/ProductDetail'; // ⭐️ ProductDetail 페이지도 import 해주세요!
import Login from './pages/Login'; // ⭐️ Login 페이지도 import 해주세요!
import Signup from './pages/Signup'; // ⭐️ Signup 페이지도 import 해주세요! 
import FindAccount from './pages/FindAccount'; // ⭐️ FindAccount 페이지도 import 해주세요!
import MyPageMain from './pages/mypage/MyPageMain';
import EditProfile from './pages/mypage/EditProfile';
import ScrapList from './pages/mypage/ScrapList';
import ShippingList from './pages/mypage/ShippingList';
import OrderList from './pages/mypage/OrderList';

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Noto+Sans+KR:wght@300;400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background-color: #F6F4EF; color: #1A1A1A; font-family: 'Noto Sans KR', sans-serif; line-height: 1.6; }
  h1, h2, h3, h4, h5, h6 { font-family: 'Playfair Display', serif; font-weight: 400; }
  a { text-decoration: none; color: inherit; }
  button { font-family: inherit; }
`;

const App: React.FC = () => {
  return (
    <Router>
      <GlobalStyle />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          
          {/* ⭐️ 여기 주석을 풀어서 활성화시켜주세요! ⭐️ */}
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/find-account" element={<FindAccount />} />
          <Route path="/mypage/*" element={<MyPageMain />}>
            <Route path="edit" element={<EditProfile />} />
            <Route path="scraps" element={<ScrapList />} />
            <Route path="shipping" element={<ShippingList />} />
            <Route path="orders" element={<OrderList />} />
          </Route>
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;