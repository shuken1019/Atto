// src/App.tsx 전체를 이 코드로 바꾸세요
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import AdminLayout from './pages/admin/AdminLayout';
import UserManagement from './pages/admin/UserManagement';
import Dashboard from './pages/admin/Dashboard';
import ProductUpload from './pages/admin/ProductUpload';
import ProductDirectWrite from './pages/admin/ProductDirectWrite';
import ProductHtmlWrite from './pages/admin/ProductHtmlWrite';
import ProductManagement from './pages/admin/ProductManagement';
import OrderManagement from './pages/admin/OrderManagement';
import OrderCreate from './pages/admin/OrderCreate';
import OrderCreatedCheck from './pages/admin/OrderCreatedCheck';
import OrderCreatedDetail from './pages/admin/OrderCreatedDetail';
import BannerManagement from './pages/admin/BannerManagement';
import SalesManagement from './pages/admin/SalesManagement';

const isAdminUser = () => {
  const rawAuth = localStorage.getItem('atto_auth');
  const rawUser = localStorage.getItem('attoUser');

  try {
    const parsedAuth = rawAuth ? (JSON.parse(rawAuth) as { role?: string }) : null;
    const parsedUser = rawUser ? (JSON.parse(rawUser) as { role?: string }) : null;
    const role = String(parsedAuth?.role ?? parsedUser?.role ?? '').toUpperCase();
    return role === 'ADMIN';
  } catch {
    return false;
  }
};

const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  if (!isAdminUser()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const GlobalStyle = createGlobalStyle`
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

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="products" element={<ProductManagement />} />
            <Route path="products/:id/edit" element={<ProductUpload />} />
            <Route path="upload" element={<ProductUpload />} />
            <Route path="upload/direct-write" element={<ProductDirectWrite />} />
            <Route path="upload/html-write" element={<ProductHtmlWrite />} />
            <Route path="orders" element={<OrderManagement />} />
            <Route path="orders/create" element={<OrderCreate />} />
            <Route path="orders/created" element={<OrderCreatedCheck />} />
            <Route path="orders/created/:orderNo" element={<OrderCreatedDetail />} />
            <Route path="sales" element={<SalesManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="banners" element={<BannerManagement />} />
          </Route>
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
