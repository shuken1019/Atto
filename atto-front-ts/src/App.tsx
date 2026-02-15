// src/App.tsx 전체를 이 코드로 바꾸세요
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { createGlobalStyle } from 'styled-components';
import Layout from './components/layout/Layout';

// 페이지 컴포넌트 임포트
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Signup from './pages/Signup';
import FindAccount from './pages/FindAccount';

import MyPageMain from './pages/mypage/MyPageMain';
import EditProfile from './pages/mypage/EditProfile';
import ScrapList from './pages/mypage/ScrapList';
import ShippingList from './pages/mypage/ShippingList';
import OrderList from './pages/mypage/OrderList';
import OrderDetail from './pages/mypage/OrderDetail';
import ExchangeRequest from './pages/mypage/ExchangeRequest';
import RefundRequest from './pages/mypage/RefundRequest';

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Noto+Sans+KR:wght@300;400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { min-height: 100%; }
  body { background-color: #F6F4EF; color: #1A1A1A; font-family: 'Noto Sans KR', sans-serif; line-height: 1.6; min-width: 320px; overflow-x: hidden; }
  h1, h2, h3, h4, h5, h6 { font-family: 'Playfair Display', serif; font-weight: 400; }
  a { text-decoration: none; color: inherit; }
`;

const App: React.FC = () => {
  return (
    <Router>
      <GlobalStyle />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/find-account" element={<FindAccount />} />
          
          <Route path="/mypage" element={<MyPageMain />}>
            <Route index element={<OrderList />} />
            <Route path="edit" element={<EditProfile />} />
            <Route path="scraps" element={<ScrapList />} />
            <Route path="shipping" element={<ShippingList />} />
            <Route path="orders" element={<OrderList />} />
            <Route path="orders/:orderNo" element={<OrderDetail />} />
            <Route path="orders/:orderNo/exchange" element={<ExchangeRequest />} />
            <Route path="orders/:orderNo/refund" element={<RefundRequest />} />
          </Route>
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
