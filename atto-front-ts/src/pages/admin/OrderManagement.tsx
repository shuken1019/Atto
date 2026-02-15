//(주문/배송/송장/환불 관리)
// src/pages/admin/OrderManagement.tsx
import React, { useState } from 'react';
import styled from 'styled-components';

const OrderManagement: React.FC = () => {
  // 주문 상태 타입: 대기, 승인(준비중), 배송중, 완료, 취소/환불
  const [orders] = useState([
    { id: 'ORD-001', user: '김아토', product: 'Relaxed Cardigan', price: 70000, status: '결제대기', invoice: '' },
    { id: 'ORD-002', user: '이수아', product: 'Linen Jacket', price: 150000, status: '배송중', invoice: '123456789' },
  ]);

  return (
    <Container>
      <Title>주문 및 배송 관리</Title>
      
      <OrderTable>
        <thead>
          <tr>
            <th>주문번호</th>
            <th>고객명</th>
            <th>상품명</th>
            <th>주문상태</th>
            <th>송장번호</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.user}</td>
              <td>{order.product}</td>
              <td>
                <StatusBadge status={order.status}>{order.status}</StatusBadge>
              </td>
              <td>
                <InvoiceInput 
                  placeholder="송장번호 입력" 
                  defaultValue={order.invoice}
                />
              </td>
              <td>
                <ActionBtn color="#333">배송시작</ActionBtn>
                <ActionBtn color="#e74c3c">환불처리</ActionBtn>
              </td>
            </tr>
          ))}
        </tbody>
      </OrderTable>
    </Container>
  );
};

export default OrderManagement;

// --- 스타일 (핵심만) ---
const Container = styled.div` padding: 40px; `;
const Title = styled.h2` font-family: 'Noto Sans KR', sans-serif; font-weight: 500; margin-bottom: 30px; `;
const OrderTable = styled.table`
  width: 100%; border-collapse: collapse;
  th, td { padding: 15px; border-bottom: 1px solid #eee; text-align: left; font-size: 14px; }
  th { background: #f9f9f9; font-weight: 600; }
`;
const StatusBadge = styled.span<{status: string}>`
  padding: 4px 8px; border-radius: 4px; font-size: 12px;
  background: ${props => props.status === '배송중' ? '#eef2ff' : '#f5f5f5'};
  color: ${props => props.status === '배송중' ? '#4f46e5' : '#666'};
`;
const InvoiceInput = styled.input` border: 1px solid #ddd; padding: 5px; font-size: 13px; `;
const ActionBtn = styled.button<{ color: string }>` background: none; border: none; color: ${(props) => props.color}; cursor: pointer; margin-right: 10px; font-size: 12px; text-decoration: underline; `;
