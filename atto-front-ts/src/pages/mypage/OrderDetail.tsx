import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';

type OrderItem = {
  name: string;
  option: string;
  qty: number;
  price: number;
};

type OrderDetailData = {
  orderId: number;
  orderNo: string;
  orderDate: string;
  status: string;
  items: OrderItem[];
  receiver: string;
  phone: string;
  address: string;
  paymentMethod: string;
  paymentStatus: string | null;
  bankInfo?: {
    bankName: string;
    accountNo: string;
    depositor: string;
    guide: string;
  };
};

const fetchOrderDetail = async (orderNo: string): Promise<OrderDetailData | null> => {
  const storedUserRaw = localStorage.getItem('attoUser');
  if (!storedUserRaw) return null;

  try {
    const user = JSON.parse(storedUserRaw) as { userId?: number };
    if (!user?.userId) return null;

    const response = await fetch(`${API_BASE_URL}/api/users/${user.userId}/orders`);
    const result = await response.json();
    if (!response.ok || !result.ok || !Array.isArray(result.orders)) return null;

    const matched = result.orders.find((o: any) => String(o.orderNo ?? o.orderId) === orderNo);
    if (!matched) return null;

    const memo = String(matched.memo ?? matched.paymentMemo ?? matched.payment?.memo ?? '').trim();

    const nameFromMemo = (() => {
      const match = memo.match(/제품명:\s*([^,]+)(?:,|$)/);
      return match ? match[1].trim() : '상품명 미제공';
    })();

    const colorFromMemo = (() => {
      const match = memo.match(/컬러:\s*([^,]+)(?:,|$)/);
      return match ? match[1].trim() : '';
    })();

    const sizeFromMemo = (() => {
      const match = memo.match(/사이즈:\s*([^,]+)(?:,|$)/);
      return match ? match[1].trim() : '';
    })();

    const qtyFromMemo = (() => {
      const match = memo.match(/수량:\s*([0-9]+)/);
      const q = match ? Number(match[1]) : 1;
      return Number.isInteger(q) && q > 0 ? q : 1;
    })();

    const normalized: OrderDetailData = {
      orderId: Number(matched.orderId),
      orderNo: String(matched.orderNo ?? matched.orderId),
      orderDate: new Date(matched.created_at).toLocaleDateString('ko-KR'),
      status: String(matched.status ?? '').toUpperCase(),
      items: Array.isArray(matched.items) && matched.items.length > 0
        ? matched.items
        : [
            {
              name: nameFromMemo,
              option: [colorFromMemo, sizeFromMemo].filter(Boolean).join(' / '),
              qty: qtyFromMemo,
              price: Number(matched.totalAmount ?? 0) / qtyFromMemo || Number(matched.totalAmount ?? 0),
            },
          ],
      receiver: matched.recipientName ?? '정보 없음',
      phone: matched.recipientPhone ?? '-',
      address: [matched.address1, matched.address2].filter(Boolean).join(' '),
      paymentMethod: matched.paymentMethod ?? '무통장입금',
      paymentStatus: matched.paymentStatus ?? null,
      bankInfo: {
        bankName: matched.bankName || '우리은행',
        accountNo: matched.bankAccount || '1002-123-456789',
        depositor: matched.depositorName || matched.userName || '주식회사 아토',
        guide: matched.memo || '입금자명과 주문자명이 다르면 메모로 알려주세요.',
      },
    };

    return normalized;
  } catch (error) {
    console.error('order detail fetch failed', error);
    return null;
  }
};

const OrderDetail: React.FC = () => {
  const { orderNo } = useParams<{ orderNo: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelPending, setCancelPending] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  const total = useMemo(() => {
    if (!order) return 0;
    return order.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [order]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('attoUser');
      if (raw) {
        const parsed = JSON.parse(raw) as { userId?: number };
        if (parsed.userId) setUserId(Number(parsed.userId));
      }
    } catch {
      setUserId(null);
    }

    let mounted = true;
    if (!orderNo) {
      setLoading(false);
      return () => undefined;
    }

    fetchOrderDetail(orderNo).then((data) => {
      if (!mounted) return;
      setOrder(data);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [orderNo]);

  if (loading) {
    return (
      <Container>
        <Title>주문 상세</Title>
        <EmptyText>불러오는 중...</EmptyText>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container>
        <Title>주문 상세</Title>
        <EmptyText>주문 정보를 찾을 수 없습니다.</EmptyText>
        <BackLink to="/mypage/orders">목록으로 돌아가기</BackLink>
      </Container>
    );
  }

  const handleCancel = async () => {
    if (!userId) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (cancelPending) return;
    if (!confirm('주문을 취소하시겠습니까?')) return;
    setCancelPending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/orders/${order.orderId}/cancel`, {
        method: 'PATCH',
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        alert(result.message ?? '취소에 실패했습니다.');
        return;
      }
      alert('주문이 취소되었습니다.');
      navigate('/mypage/orders');
    } catch {
      alert('서버 연결에 실패했습니다.');
    } finally {
      setCancelPending(false);
    }
  };

  return (
    <Container>
      <TopRow>
        <Title>주문 상세</Title>
        <BackLink to="/mypage/orders">주문내역으로</BackLink>
        <Actions>
          <ActionButton type="button" onClick={() => navigate('/mypage/shipping')}>배송지 수정</ActionButton>
          <ActionButton type="button" onClick={handleCancel} disabled={cancelPending || order.status !== 'ORDERED'}>
            {cancelPending ? '처리 중...' : '주문 취소'}
          </ActionButton>
        </Actions>
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
          <Value>{order.status === 'ORDERED' && order.paymentStatus !== 'COMPLETED' ? '입금대기' : order.status}</Value>
        </MetaRow>
      </Section>

      <Section>
        <SectionTitle>입금 안내</SectionTitle>
        <BankBox>
          <BankLine>
            <BankLabel>입금 계좌</BankLabel>
            <BankValue>
              {order.bankInfo?.bankName ?? '우리은행'} {order.bankInfo?.accountNo ?? '1002-123-456789'}
            </BankValue>
          </BankLine>
          <BankLine>
            <BankLabel>예금주</BankLabel>
            <BankValue>{order.bankInfo?.depositor ?? '주식회사 아토'}</BankValue>
          </BankLine>
          <Guide>주문 후 3일 이내에 입금해주세요. 미입금 시 주문이 자동 취소될 수 있습니다.</Guide>
          <Guide>입금자명이 다르면 메모로 알려주세요.</Guide>
          {order.paymentStatus === 'COMPLETED' ? <PaidBadge>입금확인 완료</PaidBadge> : <PendingBadge>입금 대기중</PendingBadge>}
        </BankBox>
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
          <Value>무통장입금</Value>
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

const Actions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  padding: 8px 12px;
  border: 1px solid #ddd;
  background: #fff;
  font-size: 13px;
  cursor: pointer;
  border-radius: 6px;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
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

const BankBox = styled.div`
  border: 1px dashed #d5c7b3;
  background: #fff9f2;
  padding: 16px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const BankLine = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const BankLabel = styled.span`
  min-width: 70px;
  font-size: 13px;
  color: #7a5b36;
  font-weight: 600;
`;

const BankValue = styled.span`
  font-size: 14px;
  color: #2b1b0f;
  word-break: break-all;
`;

const Guide = styled.p`
  font-size: 13px;
  color: #9b7c52;
  margin: 0;
`;

const PaidBadge = styled.span`
  align-self: flex-start;
  background: #1f8a4c;
  color: #fff;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
`;

const PendingBadge = styled.span`
  align-self: flex-start;
  background: #f6c453;
  color: #3d2a0f;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
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
