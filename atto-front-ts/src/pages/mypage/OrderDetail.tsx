import React from 'react';
import styled from 'styled-components';
import { Link, useParams } from 'react-router-dom';

type OrderDetailData = {
  orderNo: string;
  orderDate: string;
  status: string;
  items: Array<{ name: string; option: string; qty: number; price: number }>;
  receiver: string;
  phone: string;
  address: string;
  paymentMethod: string;
};

const MOCK_ORDERS: Record<string, OrderDetailData> = {
  'ORD-20240215-001': {
    orderNo: 'ORD-20240215-001',
    orderDate: '2024.02.15',
    status: '배송중',
    items: [
      { name: 'Relaxed Leas Cardigan', option: 'Cream / M', qty: 1, price: 98000 },
      { name: 'Soft Wool Muffler', option: 'Oatmeal / Free', qty: 1, price: 47000 },
    ],
    receiver: '김아토',
    phone: '010-1234-5678',
    address: '서울특별시 강남구 테헤란로 123, 아토빌딩 101호',
    paymentMethod: '신용카드',
  },
  'ORD-20240120-882': {
    orderNo: 'ORD-20240120-882',
    orderDate: '2024.01.20',
    status: '배송완료',
    items: [{ name: 'Wide Cotton Pants', option: 'Navy / L', qty: 1, price: 68000 }],
    receiver: '김아토',
    phone: '010-1234-5678',
    address: '서울특별시 강남구 테헤란로 123, 아토빌딩 101호',
    paymentMethod: '간편결제',
  },
};

const OrderDetail: React.FC = () => {
  const { orderNo } = useParams<{ orderNo: string }>();
  const order = orderNo ? MOCK_ORDERS[orderNo] : undefined;

  if (!order) {
    return (
      <Container>
        <Title>Order Detail</Title>
        <EmptyText>주문 정보를 찾을 수 없습니다.</EmptyText>
        <BackLink to="/mypage/orders">목록으로 돌아가기</BackLink>
      </Container>
    );
  }

  const total = order.items.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <Container>
      <TopRow>
        <Title>Order Detail</Title>
        <BackLink to="/mypage/orders">주문내역으로</BackLink>
      </TopRow>

      <Section>
        <SectionTitle>주문 정보</SectionTitle>
        <MetaRow>
          <Label>주문번호</Label>
          <Value>{order.orderNo}</Value>
        </MetaRow>
        <MetaRow>
          <Label>주문일자</Label>
          <Value>{order.orderDate}</Value>
        </MetaRow>
        <MetaRow>
          <Label>주문상태</Label>
          <Value>{order.status}</Value>
        </MetaRow>
      </Section>

      <Section>
        <SectionTitle>상품 정보</SectionTitle>
        {order.items.map((item, idx) => (
          <ItemRow key={`${item.name}-${idx}`}>
            <div>
              <ItemName>{item.name}</ItemName>
              <ItemOption>{item.option}</ItemOption>
              <ItemOption>수량 {item.qty}개</ItemOption>
            </div>
            <ItemPrice>₩ {item.price.toLocaleString()}</ItemPrice>
          </ItemRow>
        ))}
      </Section>

      <Section>
        <SectionTitle>배송 정보</SectionTitle>
        <MetaRow>
          <Label>받는 분</Label>
          <Value>{order.receiver}</Value>
        </MetaRow>
        <MetaRow>
          <Label>연락처</Label>
          <Value>{order.phone}</Value>
        </MetaRow>
        <MetaRow>
          <Label>주소</Label>
          <Value>{order.address}</Value>
        </MetaRow>
      </Section>

      <Section>
        <SectionTitle>결제 정보</SectionTitle>
        <MetaRow>
          <Label>결제수단</Label>
          <Value>{order.paymentMethod}</Value>
        </MetaRow>
        <MetaRow>
          <Label>결제금액</Label>
          <StrongValue>₩ {total.toLocaleString()}</StrongValue>
        </MetaRow>
      </Section>

      <TabSection>
        <TabTitle>요청</TabTitle>
        <TabButtons>
          <TabLink to={`/mypage/orders/${order.orderNo}/exchange`}>교환요청</TabLink>
          <TabLink to={`/mypage/orders/${order.orderNo}/refund`}>환불요청</TabLink>
        </TabButtons>
      </TabSection>
    </Container>
  );
};

export default OrderDetail;

const Container = styled.div`
  width: 100%;
  max-width: 760px;
  font-family: 'Noto Sans KR', sans-serif;
`;

const TopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 30px;
`;

const Title = styled.h2`
  font-size: 24px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 500;
`;

const BackLink = styled(Link)`
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 13px;
  color: #666;
  border-bottom: 1px solid transparent;

  &:hover {
    color: #1a1a1a;
    border-bottom-color: #1a1a1a;
  }
`;

const Section = styled.section`
  border: 1px solid #e9e9e9;
  background: #fff;
  padding: 20px;
  margin-bottom: 14px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 500;
  margin-bottom: 14px;
  color: #1a1a1a;
`;

const MetaRow = styled.div`
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: 8px;
  padding: 4px 0;
`;

const Label = styled.span`
  font-size: 13px;
  color: #888;
`;

const Value = styled.span`
  font-size: 14px;
  color: #333;
  line-height: 1.5;
`;

const StrongValue = styled(Value)`
  font-weight: 600;
`;

const ItemRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 0;
  border-top: 1px solid #f1f1f1;

  &:first-of-type {
    border-top: 0;
    padding-top: 0;
  }
`;

const ItemName = styled.p`
  font-size: 14px;
  color: #222;
`;

const ItemOption = styled.p`
  font-size: 13px;
  color: #777;
`;

const ItemPrice = styled.p`
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  white-space: nowrap;
`;

const EmptyText = styled.p`
  color: #777;
  font-size: 14px;
  margin-bottom: 16px;
`;

const TabSection = styled.section`
  border: 1px solid #e9e9e9;
  background: #fff;
  padding: 20px;
  margin-bottom: 14px;
`;

const TabTitle = styled.h3`
  font-size: 16px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 500;
  margin-bottom: 12px;
  color: #1a1a1a;
`;

const TabButtons = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const TabLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 108px;
  padding: 10px 12px;
  border: 1px solid #ddd;
  font-size: 13px;
  color: #333;

  &:hover {
    border-color: #333;
  }
`;
