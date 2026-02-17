import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

type DashboardResponse = {
  ok: boolean;
  summary: {
    totalUsers: number;
    pendingPayments: number;
    completedSalesTotal: number;
  };
  ordersByStatus: Array<{ status: string; cnt: number }>;
  recentOrders: Array<{ orderId: number; orderNo?: string; created_at: string; totalAmount: number; status: string; userName: string | null }>;
  lowStockItems: Array<{
    productId: number;
    name: string;
    colorId: number | null;
    sizeId: number | null;
    colorName?: string | null;
    sizeLabel?: string | null;
    stock: number;
  }>;
};

const API_BASE = 'http://127.0.0.1:4000';

const statusLabel = (status: string): string => {
  if (status === 'ORDERED') return '주문접수';
  if (status === 'PREPARING') return '배송준비';
  if (status === 'SHIPPED') return '배송중';
  if (status === 'DELIVERED') return '배송완료';
  if (status === 'CANCELLED') return '취소';
  if (status === 'REFUNDED') return '환불';
  if (status === 'EXCHANGED') return '교환';
  return status;
};

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/admin/dashboard`);
        const result = (await response.json()) as DashboardResponse;
        if (!response.ok || !result.ok) {
          alert('대시보드 조회 실패');
          return;
        }
        setData(result);
      } catch {
        alert('서버 연결에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statusMap = useMemo(() => {
    const map = new Map<string, number>();
    (data?.ordersByStatus ?? []).forEach((row) => map.set(String(row.status), Number(row.cnt ?? 0)));
    return map;
  }, [data]);

  return (
    <Page>
      <Title>대시보드</Title>

      {loading ? (
        <Card>불러오는 중...</Card>
      ) : !data ? (
        <Card>데이터를 불러오지 못했습니다.</Card>
      ) : (
        <>
          <TopGrid>
            <StatCard>
              <h4>총 회원수</h4>
              <strong>{Number(data.summary.totalUsers).toLocaleString()}명</strong>
            </StatCard>
            <StatCard>
              <h4>입금대기</h4>
              <strong>{Number(data.summary.pendingPayments).toLocaleString()}건</strong>
            </StatCard>
            <StatCard>
              <h4>누적 결제완료 금액</h4>
              <strong>₩{Number(data.summary.completedSalesTotal).toLocaleString()}</strong>
            </StatCard>
          </TopGrid>

          <Section>
            <h3>주문 상태 현황</h3>
            <StatusGrid>
              {['ORDERED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'EXCHANGED'].map((status) => (
                <StatusBox key={status}>
                  <span>{statusLabel(status)}</span>
                  <strong>{Number(statusMap.get(status) ?? 0).toLocaleString()}</strong>
                </StatusBox>
              ))}
            </StatusGrid>
          </Section>

          <Section>
            <h3>재고 부족 상품</h3>
            <Table>
              <thead>
                <tr>
                  <th>상품ID</th>
                  <th>상품명</th>
                  <th>색상</th>
                  <th>사이즈</th>
                  <th>재고</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStockItems.length === 0 ? (
                  <tr>
                    <td colSpan={5}>재고 부족 상품이 없습니다.</td>
                  </tr>
                ) : (
                  data.lowStockItems.map((item) => (
                    <tr key={`${item.productId}-${item.colorId ?? 0}-${item.sizeId ?? 0}`}>
                      <td>{item.productId}</td>
                      <td>{item.name}</td>
                      <td>{item.colorName ?? (item.colorId ? `Color-${item.colorId}` : '-')}</td>
                      <td>{item.sizeLabel ?? (item.sizeId ? `SIZE-${item.sizeId}` : '-')}</td>
                      <td>{item.stock}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Section>

          <Section>
            <h3>최근 주문</h3>
            <Table>
              <thead>
                <tr>
                  <th>주문번호</th>
                  <th>주문자</th>
                  <th>상태</th>
                  <th>금액</th>
                  <th>주문일시</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5}>주문이 없습니다.</td>
                  </tr>
                ) : (
                  data.recentOrders.map((order) => (
                    <tr key={order.orderId}>
                      <td>{order.orderNo ?? order.orderId}</td>
                      <td>{order.userName ?? '-'}</td>
                      <td>{statusLabel(order.status)}</td>
                      <td>₩{Number(order.totalAmount).toLocaleString()}</td>
                      <td>{new Date(order.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Section>
        </>
      )}
    </Page>
  );
};

export default Dashboard;

const Page = styled.div`
  margin: -40px;
  padding: 24px;
  background: #f7f5f0;
  min-height: calc(100vh - 80px);
`;

const Title = styled.h2`
  font-size: 21px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 500;
  margin-bottom: 14px;
`;

const TopGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  border: 1px solid #ece7de;
  background: #fff;
  padding: 18px;
`;

const StatCard = styled(Card)`
  h4 {
    font-size: 14px;
    color: #6b7280;
    margin-bottom: 8px;
  }

  strong {
    font-size: 20px;
    font-weight: 500;
    color: #111827;
  }
`;

const Section = styled.section`
  border: 1px solid #ece7de;
  background: #fff;
  padding: 18px;
  margin-bottom: 12px;

  h3 {
    font-size: 18px;
    margin-bottom: 10px;
    color: #111827;
  }
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StatusBox = styled.div`
  border: 1px solid #e5e7eb;
  background: #fcfbf8;
  padding: 10px;

  span {
    display: block;
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 4px;
  }

  strong {
    font-size: 16px;
    color: #111827;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 10px 8px;
    border-bottom: 1px solid #ece7de;
    text-align: left;
    font-size: 13px;
  }

  th {
    background: #fcfbf8;
    color: #6b7280;
    font-weight: 600;
  }
`;
