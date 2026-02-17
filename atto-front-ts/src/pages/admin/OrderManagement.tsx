import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

type AdminOrder = {
  orderId: number;
  orderNo?: string;
  userId: number;
  paymentId: number | null;
  totalAmount: number;
  status: 'ORDERED' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED' | 'EXCHANGED';
  created_at: string;
  userLoginId: string | null;
  userName: string | null;
  paymentStatus: 'PENDING' | 'COMPLETED' | 'REFUNDED' | null;
  recipientName: string | null;
  address1: string | null;
  address2: string | null;
};

const API_BASE = 'http://127.0.0.1:4000';

const STATUS_LABEL: Record<AdminOrder['status'], string> = {
  ORDERED: '주문접수',
  PREPARING: '배송준비',
  SHIPPED: '배송중',
  DELIVERED: '배송완료',
  CANCELLED: '취소',
  REFUNDED: '환불',
  EXCHANGED: '교환',
};

const PAYMENT_STATUS_LABEL: Record<'PENDING' | 'COMPLETED' | 'REFUNDED', string> = {
  PENDING: '입금대기',
  COMPLETED: '결제완료',
  REFUNDED: '환불완료',
};

const statusTabs: Array<{ key: 'ALL' | AdminOrder['status']; label: string }> = [
  { key: 'ALL', label: '전체' },
  { key: 'ORDERED', label: '주문접수' },
  { key: 'PREPARING', label: '배송준비' },
  { key: 'SHIPPED', label: '배송중' },
  { key: 'DELIVERED', label: '배송완료' },
  { key: 'CANCELLED', label: '취소' },
  { key: 'REFUNDED', label: '환불' },
  { key: 'EXCHANGED', label: '교환' },
];

const statusOptions: AdminOrder['status'][] = ['ORDERED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'EXCHANGED'];

const OrderManagement: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'ALL' | AdminOrder['status']>('ALL');
  const [keyword, setKeyword] = useState('');
  const [statusDraft, setStatusDraft] = useState<Record<number, AdminOrder['status']>>({});
  const [workingId, setWorkingId] = useState<number | null>(null);

  const loadOrders = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/orders`);
      const result = await response.json();
      if (!response.ok || !result.ok) {
        alert(result.message ?? '주문 목록 조회 실패');
        return;
      }
      const nextOrders = Array.isArray(result.orders) ? (result.orders as AdminOrder[]) : [];
      setOrders(nextOrders);
      setStatusDraft((prev) => {
        const next: Record<number, AdminOrder['status']> = { ...prev };
        nextOrders.forEach((order) => {
          next[order.orderId] = order.status;
        });
        return next;
      });
    } catch {
      alert('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const counts = useMemo(() => {
    const base: Record<string, number> = { ALL: orders.length };
    statusTabs.forEach((item) => {
      if (item.key === 'ALL') return;
      base[item.key] = orders.filter((order) => order.status === item.key).length;
    });
    return base;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const lower = keyword.trim().toLowerCase();
    return orders.filter((order) => {
      if (tab !== 'ALL' && order.status !== tab) return false;
      if (!lower) return true;
      return (
        String(order.orderId).includes(lower) ||
        String(order.userLoginId ?? '').toLowerCase().includes(lower) ||
        String(order.userName ?? '').toLowerCase().includes(lower) ||
        String(order.recipientName ?? '').toLowerCase().includes(lower)
      );
    });
  }, [orders, tab, keyword]);

  const patchOrderStatus = async (orderId: number) => {
    const status = statusDraft[orderId];
    if (!status) return;
    setWorkingId(orderId);
    try {
      const response = await fetch(`${API_BASE}/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        alert(result.message ?? '상태 변경 실패');
        return;
      }
      await loadOrders();
    } catch {
      alert('서버 연결에 실패했습니다.');
    } finally {
      setWorkingId(null);
    }
  };

  const completePayment = async (orderId: number) => {
    setWorkingId(orderId);
    try {
      const response = await fetch(`${API_BASE}/api/admin/orders/${orderId}/payment-complete`, { method: 'PATCH' });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        alert(result.message ?? '입금완료 처리 실패');
        return;
      }
      await loadOrders();
    } catch {
      alert('서버 연결에 실패했습니다.');
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <Page>
      <Top>
        <h2>주문 및 배송</h2>
        <CreateButton type="button" onClick={() => navigate('/admin/orders/create')}>
          주문 생성
        </CreateButton>
      </Top>

      <Tabs>
        {statusTabs.map((item) => (
          <TabButton key={item.key} type="button" $active={tab === item.key} onClick={() => setTab(item.key)}>
            {item.label} <span>{counts[item.key] ?? 0}</span>
          </TabButton>
        ))}
      </Tabs>

      <SearchRow>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="주문번호 / 아이디 / 주문자명 / 수령인 검색"
        />
      </SearchRow>

      <Card>
        <TableHead>
          <span>주문번호</span>
          <span>주문자</span>
          <span>결제</span>
          <span>금액</span>
          <span>주문상태</span>
          <span>배송지</span>
          <span>관리</span>
        </TableHead>

        {loading ? (
          <Empty>불러오는 중...</Empty>
        ) : filteredOrders.length === 0 ? (
          <Empty>주문이 없습니다.</Empty>
        ) : (
          filteredOrders.map((order) => (
            <Row key={order.orderId}>
              <div>
                <strong>{order.orderNo ?? String(order.orderId)}</strong>
                <small>{new Date(order.created_at).toLocaleString()}</small>
              </div>
              <div>
                <strong>{order.userName ?? '-'}</strong>
                <small>{order.userLoginId ?? '-'}</small>
              </div>
              <div>
                <strong>{order.paymentStatus ? PAYMENT_STATUS_LABEL[order.paymentStatus] : '미연결'}</strong>
                <small>{order.paymentId ? `paymentId: ${order.paymentId}` : '-'}</small>
              </div>
              <div>
                <strong>₩{Number(order.totalAmount ?? 0).toLocaleString()}</strong>
              </div>
              <div>
                <Badge>{STATUS_LABEL[order.status]}</Badge>
              </div>
              <div>
                <strong>{order.recipientName ?? '-'}</strong>
                <small>{(order.address1 ?? '').trim()} {(order.address2 ?? '').trim()}</small>
              </div>
              <ActionCell>
                {order.paymentStatus === 'PENDING' && (
                  <MiniButton type="button" disabled={workingId === order.orderId} onClick={() => completePayment(order.orderId)}>
                    입금완료
                  </MiniButton>
                )}
                <select
                  value={statusDraft[order.orderId] ?? order.status}
                  onChange={(e) =>
                    setStatusDraft((prev) => ({
                      ...prev,
                      [order.orderId]: e.target.value as AdminOrder['status'],
                    }))
                  }
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABEL[status]}
                    </option>
                  ))}
                </select>
                <MiniButton type="button" disabled={workingId === order.orderId} onClick={() => patchOrderStatus(order.orderId)}>
                  상태반영
                </MiniButton>
              </ActionCell>
            </Row>
          ))
        )}
      </Card>
    </Page>
  );
};

export default OrderManagement;

const Page = styled.div`
  background: #f7f5f0;
  min-height: calc(100vh - 80px);
  margin: -40px;
  padding: 24px;
`;

const Top = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;

  h2 {
    font-size: 21px;
    font-weight: 500;
    color: #111827;
  }
`;

const CreateButton = styled.button`
  height: 42px;
  padding: 0 16px;
  border: none;
  background: #111827;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
`;

const Tabs = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
`;

const TabButton = styled.button<{ $active?: boolean }>`
  height: 38px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  background: ${(props) => (props.$active ? '#111827' : '#fff')};
  color: ${(props) => (props.$active ? '#fff' : '#374151')};
  cursor: pointer;

  span {
    margin-left: 6px;
    font-size: 12px;
    opacity: 0.85;
  }
`;

const SearchRow = styled.div`
  margin-bottom: 12px;

  input {
    width: 100%;
    max-width: 460px;
    height: 42px;
    padding: 0 12px;
    border: 1px solid #d1d5db;
    font-size: 14px;
  }
`;

const Card = styled.section`
  border: 1px solid #e5e7eb;
  background: #fff;
`;

const TableHead = styled.div`
  display: grid;
  grid-template-columns: 1.05fr 0.9fr 0.8fr 0.6fr 0.7fr 1.1fr 1.2fr;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 12px;
  color: #6b7280;
  font-weight: 700;

  @media (max-width: 1200px) {
    display: none;
  }
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1.05fr 0.9fr 0.8fr 0.6fr 0.7fr 1.1fr 1.2fr;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid #f0f0f0;
  align-items: center;

  strong {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #111827;
  }

  small {
    display: block;
    font-size: 12px;
    color: #6b7280;
    margin-top: 2px;
  }

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const ActionCell = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  select {
    height: 34px;
    border: 1px solid #d1d5db;
    padding: 0 8px;
  }
`;

const MiniButton = styled.button`
  height: 34px;
  border: 1px solid #d1d5db;
  background: #fff;
  padding: 0 10px;
  font-size: 12px;
  cursor: pointer;
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  background: #f4f4f5;
  font-size: 12px;
  color: #374151;
`;

const Empty = styled.div`
  padding: 20px 14px;
  color: #6b7280;
  font-size: 14px;
`;
