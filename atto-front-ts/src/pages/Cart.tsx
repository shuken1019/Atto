// src/pages/Cart.tsx

import React, { useState } from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import { mockProducts } from '../mocks/product';

interface CartItemType {
  id: number;
  productId: number;
  name: string;
  price: number;
  thumbnail: string;
  color: string;
  size: string;
  quantity: number;
}

const Cart: React.FC = () => {
  const navigate = useNavigate(); // ⭐️ 결제 버튼에서 사용할 예정

  // ⭐️ 수정됨: useEffect를 없애고, useState 초기값으로 데이터를 바로 넣습니다.
  // 이렇게 하면 불필요한 렌더링이 줄어들어 성능이 좋아집니다.
  const [cartItems, setCartItems] = useState<CartItemType[]>([
    {
      id: 101,
      productId: mockProducts[0].id,
      name: mockProducts[0].name,
      price: mockProducts[0].price,
      thumbnail: mockProducts[0].thumbnailImage,
      color: 'Beige',
      size: 'M',
      quantity: 1,
    },
    {
      id: 102,
      productId: mockProducts[1].id,
      name: mockProducts[1].name,
      price: mockProducts[1].price,
      thumbnail: mockProducts[1].thumbnailImage,
      color: 'Charcoal',
      size: 'L',
      quantity: 2,
    },
  ]);

  // 수량 변경 핸들러
  const handleQuantity = (id: number, type: 'plus' | 'minus') => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = type === 'plus' ? item.quantity + 1 : item.quantity - 1;
        return { ...item, quantity: newQty < 1 ? 1 : newQty };
      }
      return item;
    }));
  };

  // 삭제 핸들러
  const handleRemove = (id: number) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  // 결제 버튼 핸들러 (navigate 사용)
  const handleCheckout = () => {
    alert('결제 기능은 준비 중입니다. 메인으로 이동합니다.');
    // ⭐️ 여기서 navigate를 사용해서 에러 해결!
    navigate('/'); 
  };

  // 금액 계산
  const subTotal = cartItems.reduce((acc, cur) => acc + (cur.price * cur.quantity), 0);
  const shippingFee = subTotal > 100000 ? 0 : 3000;
  const total = subTotal + shippingFee;

  if (cartItems.length === 0) {
    return (
      <EmptyContainer>
        <h2>Your cart is empty.</h2>
        <p>장바구니가 비어있습니다.</p>
        <ShopLink to="/shop">GO SHOPPING</ShopLink>
      </EmptyContainer>
    );
  }

  return (
    <Container>
      <Title>SHOPPING CART</Title>
      
      <CartLayout>
        {/* 왼쪽: 상품 목록 */}
        <ItemsSection>
          <TableHeader>
            <span>Product</span>
            <span>Quantity</span>
            <span>Price</span>
          </TableHeader>
          
          {cartItems.map((item) => (
            <CartItem key={item.id}>
              <ItemInfo>
                <img src={item.thumbnail} alt={item.name} />
                <div>
                  <h4>{item.name}</h4>
                  <p>Option: {item.color} / {item.size}</p>
                  <RemoveBtn onClick={() => handleRemove(item.id)}>Remove</RemoveBtn>
                </div>
              </ItemInfo>
              
              <QuantityControl>
                <button onClick={() => handleQuantity(item.id, 'minus')}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => handleQuantity(item.id, 'plus')}>+</button>
              </QuantityControl>
              
              <ItemPrice>
                ₩ {(item.price * item.quantity).toLocaleString()}
              </ItemPrice>
            </CartItem>
          ))}
        </ItemsSection>

        {/* 오른쪽: 주문 요약 */}
        <SummarySection>
          <SummaryBox>
            <h3>Order Summary</h3>
            <SummaryRow>
              <span>Subtotal</span>
              <span>₩ {subTotal.toLocaleString()}</span>
            </SummaryRow>
            <SummaryRow>
              <span>Shipping</span>
              <span>{shippingFee === 0 ? 'Free' : `₩ ${shippingFee.toLocaleString()}`}</span>
            </SummaryRow>
            <Divider />
            <TotalRow>
              <span>Total</span>
              <span>₩ {total.toLocaleString()}</span>
            </TotalRow>
            
            {/* ⭐️ 핸들러 연결 */}
            <CheckoutBtn onClick={handleCheckout}>
              CHECKOUT
            </CheckoutBtn>
          </SummaryBox>
        </SummarySection>
      </CartLayout>
    </Container>
  );
};

export default Cart;

// ---------- Styled Components ----------
// (기존 스타일 코드와 동일합니다)

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 20px 100px;
`;

const Title = styled.h2`
  text-align: center;
  font-size: 32px;
  font-family: 'Playfair Display', serif;
  margin-bottom: 60px;
  letter-spacing: 1px;
`;

const CartLayout = styled.div`
  display: flex;
  gap: 60px;
  
  @media (max-width: 900px) {
    flex-direction: column;
  }
`;

const ItemsSection = styled.div`
  flex: 2;
`;

const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #1a1a1a;
  padding-bottom: 15px;
  margin-bottom: 20px;
  font-size: 13px;
  text-transform: uppercase;
  color: #666;
  
  span:nth-child(1) { flex: 2; }
  span:nth-child(2) { flex: 1; text-align: center; }
  span:nth-child(3) { flex: 0.5; text-align: right; }
  
  @media (max-width: 600px) { display: none; }
`;

const CartItem = styled.div`
  display: flex;
  align-items: center;
  padding: 24px 0;
  border-bottom: 1px solid #eee;
  
  @media (max-width: 600px) {
    flex-wrap: wrap;
    gap: 20px;
  }
`;

const ItemInfo = styled.div`
  flex: 2;
  display: flex;
  gap: 20px;
  
  img {
    width: 90px;
    height: 120px;
    object-fit: cover;
    background-color: #f0f0f0;
  }
  
  div {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 6px;
  }
  
  h4 { font-size: 15px; font-weight: 500; color: #1a1a1a; }
  p { font-size: 13px; color: #666; }
`;

const RemoveBtn = styled.button`
  background: none;
  border: none;
  text-align: left;
  padding: 0;
  font-size: 12px;
  color: #999;
  text-decoration: underline;
  cursor: pointer;
  margin-top: 5px;
  &:hover { color: #333; }
`;

const QuantityControl = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  
  button {
    width: 28px;
    height: 28px;
    border: 1px solid #ddd;
    background: #fff;
    cursor: pointer;
    &:hover { border-color: #333; }
  }
  
  span { font-size: 14px; min-width: 20px; text-align: center; }
`;

const ItemPrice = styled.div`
  flex: 0.5;
  text-align: right;
  font-size: 15px;
  font-weight: 600;
`;

const SummarySection = styled.div`
  flex: 1;
`;

const SummaryBox = styled.div`
  background-color: #fff;
  padding: 30px;
  border: 1px solid #eee;
  position: sticky;
  top: 100px;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  font-size: 14px;
  color: #555;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid #eee;
  margin: 20px 0;
`;

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 30px;
`;

const CheckoutBtn = styled.button`
  width: 100%;
  padding: 18px;
  background-color: #1a1a1a;
  color: #fff;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 1px;
  transition: background 0.3s;
  
  &:hover { background-color: #333; }
`;

const EmptyContainer = styled.div`
  text-align: center;
  padding: 100px 20px;
  
  h2 { font-size: 24px; font-family: 'Playfair Display', serif; margin-bottom: 10px; }
  p { color: #888; margin-bottom: 30px; }
`;

const ShopLink = styled(Link)`
  display: inline-block;
  padding: 15px 40px;
  background-color: #1a1a1a;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1px;
  transition: background 0.3s;
  &:hover { background-color: #333; }
`;