import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

type OrderSummary = {
  orderNo: string;
  date: string;
  status: string;
  productName: string;
  price: number;
};

const ORDERS: OrderSummary[] = [
  {
    orderNo: 'ORD-20240215-001',
    date: '2024.02.15',
    status: '배송중',
    productName: 'Relaxed Leas Cardigan 외 1건',
    price: 145000,
  },
  {
    orderNo: 'ORD-20240120-882',
    date: '2024.01.20',
    status: '배송완료',
    productName: 'Wide Cotton Pants',
    price: 68000,
  },
];

const OrderList: React.FC = () => {
  return (
    <Container>
      <Title>Order History</Title>

      {ORDERS.map((order) => (
        <OrderItem key={order.orderNo}>
          <OrderHeader>
            <Date>{order.date}</Date>
            <OrderNo>{order.orderNo}</OrderNo>
            <Status className={order.status === '배송완료' ? 'done' : ''}>{order.status}</Status>
          </OrderHeader>
          <ProductInfo>
            <Info>
              <ProdName>{order.productName}</ProdName>
              <Price>₩ {order.price.toLocaleString()}</Price>
            </Info>
          </ProductInfo>
          <DetailLink to={`/mypage/orders/${order.orderNo}`}>상세조회</DetailLink>
        </OrderItem>
      ))}
    </Container>
  );
};

export default OrderList;

const Container = styled.div`
  width: 100%;
  font-family: 'Noto Sans KR', sans-serif;
`;

const Title = styled.h2`
  font-size: 24px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 500;
  margin-bottom: 30px;
  border-bottom: 1px solid #ddd;
  padding-bottom: 15px;
`;

const OrderItem = styled.div`
  border-bottom: 1px solid #eee;
  padding: 24px 0;
`;

const OrderHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
  flex-wrap: wrap;
`;

const Date = styled.span`
  font-weight: 600;
  color: #333;
`;

const OrderNo = styled.span`
  color: #999;
  font-size: 13px;
`;

const Status = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;

  &.done {
    color: #888;
  }
`;

const ProductInfo = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const ProdName = styled.span`
  font-size: 15px;
`;

const Price = styled.span`
  font-weight: 600;
  font-size: 14px;
`;

const DetailLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 92px;
  padding: 8px 12px;
  font-size: 12px;
  background: #fff;
  border: 1px solid #ddd;
  color: #333;

  &:hover {
    border-color: #333;
  }
`;
