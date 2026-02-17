import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { API_BASE_URL } from '../../config/api';

type StoredUser = {
  userId: number;
};

type OrderRow = {
  orderId: number;
  orderNo?: string;
  userId: number;
  paymentId: number | null;
  addressId: number | null;
  totalAmount: number;
  status: 'ORDERED' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED' | 'EXCHANGED';
  paymentStatus: 'PENDING' | 'COMPLETED' | 'REFUNDED' | null;
  created_at: string;
};

const statusLabel = (order: OrderRow): string => {
  if (order.status === 'ORDERED') {
    if (order.paymentStatus === 'COMPLETED') return '결제완료';
    return '입금대기';
  }

  switch (order.status) {
    case 'PREPARING':
      return '배송준비중';
    case 'SHIPPED':
      return '배송중';
    case 'DELIVERED':
      return '배송완료';
    case 'CANCELLED':
      return '주문취소';
    case 'REFUNDED':
      return '환불완료';
    case 'EXCHANGED':
      return '교환처리';
    default:
      return order.status;
  }
};

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
};

const OrderList: React.FC = () => {
  const user = useMemo<StoredUser | null>(() => {
    try {
      const raw = localStorage.getItem('attoUser');
      if (!raw) return null;
      return JSON.parse(raw) as StoredUser;
    } catch {
      return null;
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!user?.userId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/users/${user.userId}/orders`);
        const result = await response.json();

        if (!response.ok || !result.ok) {
          alert(result.message ?? '주문 내역을 불러오지 못했습니다.');
          return;
        }

        setOrders(Array.isArray(result.orders) ? result.orders : []);
      } catch {
        alert('서버 연결에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.userId]);

  if (!user?.userId) {
    return <Container>로그인 후 이용해주세요.</Container>;
  }

  return (
    <Container>
      <Title>Order History</Title>

      {loading ? (
        <EmptyText>불러오는 중...</EmptyText>
      ) : orders.length === 0 ? (
        <EmptyText>주문 내역이 없습니다.</EmptyText>
      ) : (
        orders.map((order) => (
          <OrderItem key={order.orderId}>
            <OrderHeader>
              <OrderDate>{formatDate(order.created_at)}</OrderDate>
              <OrderNo>{order.orderNo ?? `ORD-${String(order.orderId).padStart(6, '0')}`}</OrderNo>
              <Status className={order.status === 'DELIVERED' ? 'done' : ''}>{statusLabel(order)}</Status>
            </OrderHeader>
            <ProductInfo>
              <Info>
                <ProdName>주문번호 {order.orderNo ?? `#${order.orderId}`}</ProdName>
                <Price>{order.totalAmount.toLocaleString()}원</Price>
              </Info>
            </ProductInfo>
            <Button type="button">상세보기</Button>
          </OrderItem>
        ))
      )}
    </Container>
  );
};

export default OrderList;

const Container = styled.div`
  width: 100%;
`;

const Title = styled.h2`
  font-size: 24px;
  font-family: 'Playfair Display', serif;
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
`;

const OrderDate = styled.span`
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

const Button = styled.button`
  padding: 8px 12px;
  font-size: 12px;
  background: #fff;
  border: 1px solid #ddd;
  color: #333;
  cursor: pointer;

  &:hover {
    border-color: #333;
  }
`;

const EmptyText = styled.p`
  color: #777;
  font-size: 14px;
  padding: 20px 0;
`;
