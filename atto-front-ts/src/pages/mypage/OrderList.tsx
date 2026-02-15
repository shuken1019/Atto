import React from 'react';
import styled from 'styled-components';

const OrderList: React.FC = () => {
  return (
    <Container>
      <Title>Order History</Title>
      
      {/* 주문 내역 아이템 1 */}
      <OrderItem>
        <OrderHeader>
          <Date>2024.02.15</Date>
          <OrderNo>ORD-20240215-001</OrderNo>
          <Status>배송중</Status>
        </OrderHeader>
        <ProductInfo>
          <Info>
            <ProdName>Relaxed Leas Cardigan 외 1건</ProdName>
            <Price>₩ 145,000</Price>
          </Info>
        </ProductInfo>
        <Button>배송조회</Button>
      </OrderItem>

       {/* 주문 내역 아이템 2 */}
       <OrderItem>
        <OrderHeader>
          <Date>2024.01.20</Date>
          <OrderNo>ORD-20240120-882</OrderNo>
          <Status className="done">배송완료</Status>
        </OrderHeader>
        <ProductInfo>
          <Info>
            <ProdName>Wide Cotton Pants</ProdName>
            <Price>₩ 68,000</Price>
          </Info>
        </ProductInfo>
        <Button>리뷰작성</Button>
      </OrderItem>

    </Container>
  );
};

export default OrderList;

const Container = styled.div` width: 100%; `;
const Title = styled.h2` font-size: 24px; font-family: 'Playfair Display', serif; margin-bottom: 30px; border-bottom: 1px solid #ddd; padding-bottom: 15px; `;
const OrderItem = styled.div` border-bottom: 1px solid #eee; padding: 24px 0; `;
const OrderHeader = styled.div` display: flex; align-items: center; gap: 15px; margin-bottom: 15px; `;
const Date = styled.span` font-weight: 600; color: #333; `;
const OrderNo = styled.span` color: #999; font-size: 13px; `;
const Status = styled.span` font-size: 13px; font-weight: 600; color: #1a1a1a; &.done { color: #888; } `;
const ProductInfo = styled.div` display: flex; gap: 15px; margin-bottom: 15px; `;
const Info = styled.div` display: flex; flex-direction: column; gap: 5px; `;
const ProdName = styled.span` font-size: 15px; `;
const Price = styled.span` font-weight: 600; font-size: 14px; `;
const Button = styled.button` padding: 8px 12px; font-size: 12px; background: #fff; border: 1px solid #ddd; cursor: pointer; &:hover { border-color: #333; } `;