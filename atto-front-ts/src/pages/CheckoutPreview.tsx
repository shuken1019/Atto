import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { createPendingOrder } from '../services/orderService';
import { API_BASE_URL } from '../config/api';
import { authFetch } from '../utils/authFetch';

const BANK_NAME = '우리은행';
const ACCOUNT_NO = '1002-123-456789';
const ACCOUNT_OWNER = '주식회사 아토';

type CheckoutState = {
  productId: number;
  productName: string;
  thumbnail?: string;
  price: number;
  color: string;
  size: string | null;
  qty: number;
};

const CheckoutPreview: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const checkout = (state ?? {}) as Partial<CheckoutState>;
  const [pending, setPending] = useState(false);
  const userInfo = useMemo(() => {
    try {
      const raw = localStorage.getItem('attoUser');
      if (!raw) return null;
      return JSON.parse(raw) as { name?: string; phone?: string };
    } catch {
      return null;
    }
  }, []);
  const [depositorName, setDepositorName] = useState(userInfo?.name ?? '');
  const [depositorPhone, setDepositorPhone] = useState(userInfo?.phone ?? '');
  const [addressLoading, setAddressLoading] = useState(true);
  const [address, setAddress] = useState<{ recipientName: string; phone: string; address1: string; address2: string }>({
    recipientName: userInfo?.name ?? '',
    phone: userInfo?.phone ?? '',
    address1: '',
    address2: '',
  });
  const [confirmOpen, setConfirmOpen] = useState(false);

  // 기본 배송지 로드
  React.useEffect(() => {
    const loadAddress = async () => {
      const rawUser = localStorage.getItem('attoUser');
      if (!rawUser) {
        setAddressLoading(false);
        return;
      }
      try {
        const parsed = JSON.parse(rawUser) as { userId?: number; name?: string; phone?: string };
        if (!parsed?.userId) {
          setAddressLoading(false);
          return;
        }
        const res = await authFetch(`${API_BASE_URL}/api/users/${parsed.userId}/addresses`);
        const result = await res.json();
        if (res.ok && result.ok && Array.isArray(result.addresses) && result.addresses.length > 0) {
          const defaultAddr = result.addresses.find((a: any) => a.isDefault) ?? result.addresses[0];
          setAddress({
            recipientName: defaultAddr.recipientName ?? parsed.name ?? '',
            phone: defaultAddr.phone ?? parsed.phone ?? '',
            address1: defaultAddr.address1 ?? '',
            address2: defaultAddr.address2 ?? '',
          });
        } else {
          setAddress((prev) => ({
            ...prev,
            recipientName: parsed.name ?? '',
            phone: parsed.phone ?? '',
          }));
        }
      } catch {
        // ignore
      } finally {
        setAddressLoading(false);
      }
    };
    loadAddress();
  }, []);

  const total = useMemo(() => {
    const price = Number(checkout.price ?? 0);
    const qty = Math.max(1, Number(checkout.qty ?? 1));
    return price * qty;
  }, [checkout.price, checkout.qty]);

  const validateRequired = (): boolean => {
    const hasDepositor = depositorName.trim().length > 0;
    const hasPhone = depositorPhone.trim().length > 0;
    const hasAddress = [address.recipientName, address.phone, address.address1].some((v) => String(v ?? '').trim().length > 0);

    if (!hasDepositor || !hasPhone || !hasAddress) {
      const missing: string[] = [];
      if (!hasDepositor) missing.push('입금자명');
      if (!hasPhone) missing.push('연락처');
      if (!hasAddress) missing.push('배송지');
      alert(`${missing.join(', ')} 정보를 입력해주세요.`);
      return false;
    }
    return true;
  };

  const handlePay = async () => {
    if (!checkout.productId || !checkout.productName) {
      alert('주문 정보가 없습니다.');
      navigate('/cart');
      return;
    }
    if (pending) return;

    const hasDepositor = depositorName.trim().length > 0;
    const hasPhone = depositorPhone.trim().length > 0;
    const hasAddress = [address.recipientName, address.phone, address.address1].some((v) => String(v ?? '').trim().length > 0);
    if (!hasDepositor || !hasPhone || !hasAddress) {
      const missing: string[] = [];
      if (!hasDepositor) missing.push('입금자명');
      if (!hasPhone) missing.push('연락처');
      if (!hasAddress) missing.push('배송지');
      alert(`${missing.join(', ')} 정보를 입력해주세요.`);
      return;
    }

    setPending(true);
    try {
      const { orderNo } = await createPendingOrder({
        totalAmount: total,
        memo: `제품명: ${checkout.productName}, 컬러: ${checkout.color ?? ''}, 사이즈: ${checkout.size ?? ''}, 수량: ${checkout.qty ?? 1}, 입금자명: ${depositorName}, 연락처: ${depositorPhone}`,
      });
      // 주문 생성 후 바로 주문내역으로 이동 (브라우저 기본 alert 노출 안 함)
      navigate('/mypage/orders', { state: { newOrderNo: orderNo } });
    } catch (error) {
      const message = error instanceof Error ? error.message : '주문 생성에 실패했습니다.';
      alert(message);
    } finally {
      setPending(false);
      setConfirmOpen(false);
    }
  };

  const handleOpenConfirm = () => {
    if (!validateRequired()) return;
    setConfirmOpen(true);
  };

  if (!checkout.productId) {
    return <EmptyPage>주문 정보를 불러오지 못했습니다.</EmptyPage>;
  }

  return (
    <Page>
      <Header>
        <button type="button" onClick={() => navigate(-1)} aria-label="뒤로가기">
          ←
        </button>
        <h2>주문/결제</h2>
      </Header>

      <ContentGrid>
        <MainColumn>
          <Section>
            <SectionTitle>주문 상품 총 {checkout.qty ?? 1}개</SectionTitle>
            <FreeBadge>무료배송</FreeBadge>

            <ItemCard>
              <Thumb>
                {checkout.thumbnail ? <img src={checkout.thumbnail} alt={checkout.productName} /> : <div className="placeholder" />}
              </Thumb>
              <ItemInfo>
                <Brand>{checkout.productName}</Brand>
                <ItemName>{checkout.productName}</ItemName>
                <PriceRow>
                  <Price>₩{Number(checkout.price ?? 0).toLocaleString()}</Price>
                  <Qty> {checkout.qty ?? 1}개</Qty>
                </PriceRow>
                <OptionTag>{checkout.color ?? ''} {checkout.size ? `/ ${checkout.size}` : ''}</OptionTag>
              </ItemInfo>
            </ItemCard>
          </Section>

          <Section>
            <SectionTitle>입금자 / 연락처</SectionTitle>
            <ContactCard>
              <div>
                <Label>입금자명</Label>
                <Input
                  type="text"
                  placeholder="입금자명을 입력하세요"
                  value={depositorName}
                  onChange={(e) => setDepositorName(e.target.value)}
                />
              </div>
              <div>
                <Label>전화번호</Label>
                <Input
                  type="tel"
                  placeholder="연락처를 입력하세요"
                  value={depositorPhone}
                  onChange={(e) => setDepositorPhone(e.target.value)}
                />
              </div>
              <Hint>입금 확인 및 배송 안내를 위해 정확히 입력해주세요.</Hint>
            </ContactCard>
          </Section>

          <Section>
            <SectionTitle>배송지</SectionTitle>
            <AddressBox>
              <HeaderRow>
                <div>
                  <strong>받으실 주소가 맞는지 확인해주세요</strong>
                  <p>{address.recipientName || '미등록'} · {address.phone || '전화번호 미등록'}</p>
                  <p className="address">
                    {addressLoading
                      ? '배송지 불러오는 중...'
                      : address.address1
                        ? `${address.address1} ${address.address2 ?? ''}`.trim()
                        : '기본 배송지가 없어요. 마이페이지 > 배송지 관리에서 등록해주세요.'}
                  </p>
                </div>
                <EditLink type="button" onClick={() => navigate('/mypage/shipping')}>변경하기</EditLink>
              </HeaderRow>
            </AddressBox>
          </Section>
        </MainColumn>

        <Aside>
          <SummaryCard>
            <SummaryHead>결제 금액</SummaryHead>
            <Summary>
              <Row>
                <span>총 상품금액</span>
                <span>₩{total.toLocaleString()}</span>
              </Row>
              <Row>
                <span>배송비</span>
                <FreeText>무료배송</FreeText>
              </Row>
              <Divider />
              <Row className="total">
                <span>총 결제금액</span>
                <strong>₩{total.toLocaleString()}</strong>
              </Row>
            </Summary>
            <PayButton type="button" onClick={handleOpenConfirm} disabled={pending}>
              {pending ? '처리 중...' : `₩${total.toLocaleString()} 결제하기`}
            </PayButton>
          </SummaryCard>
        </Aside>
      </ContentGrid>

      {confirmOpen && (
        <>
          <ModalBackdrop onClick={() => setConfirmOpen(false)} />
          <ModalCard>
            <ModalTitle>입금 안내</ModalTitle>
            <p>아래 계좌로 입금해주시면 결제가 완료됩니다.</p>
            <AccountBox>
              <strong>{BANK_NAME}</strong>
              <AccountNo>{ACCOUNT_NO}</AccountNo>
              <small>예금주: {ACCOUNT_OWNER}</small>
            </AccountBox>
            <p>입금자명: {depositorName || '미입력'} / 연락처: {depositorPhone || '미입력'}</p>
            <ModalActions>
              <ModalButton type="button" onClick={() => setConfirmOpen(false)} $variant="ghost">
                취소
              </ModalButton>
              <ModalButton type="button" onClick={handlePay} disabled={pending}>
                {pending ? '처리 중...' : '주문 완료'}
              </ModalButton>
            </ModalActions>
          </ModalCard>
        </>
      )}

    </Page>
  );
};

export default CheckoutPreview;

const Page = styled.div`
  min-height: 100vh;
  background: #f6f4ef;
  padding-bottom: 40px;
`;

const Header = styled.header`
  position: sticky;
  top: 0;
  background: #fff;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 10;
  border-bottom: 1px solid #eee;

  h2 {
    font-size: 17px;
    margin: 0;
  }

  button {
    border: none;
    background: transparent;
    font-size: 20px;
    cursor: pointer;
  }
`;

const Section = styled.section`
  background: #fff;
  padding: 16px;
  margin-top: 10px;
  border-radius: 14px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.06);
`;

const SectionTitle = styled.h3`
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 700;
  display: inline-block;
`;

const FreeBadge = styled.span`
  color: #f97316;
  font-weight: 700;
  font-size: 13px;
  margin-left: 8px;
`;

const ItemCard = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 10px;
  align-items: center;
`;

const Thumb = styled.div`
  width: 78px;
  height: 78px;
  background: #f3f4f6;
  border-radius: 10px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .placeholder {
    width: 100%;
    height: 100%;
    background: #e5e7eb;
  }
`;

const ItemInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Brand = styled.span`
  font-size: 12px;
  color: #6b7280;
`;

const ItemName = styled.span`
  font-size: 14px;
  color: #111827;
  line-height: 1.4;
`;

const PriceRow = styled.div`
  display: flex;
  gap: 6px;
  align-items: baseline;
`;

const Price = styled.span`
  font-size: 16px;
  font-weight: 700;
`;

const Qty = styled.span`
  font-size: 12px;
  color: #6b7280;
`;

const OptionTag = styled.span`
  display: inline-block;
  font-size: 12px;
  color: #374151;
  background: #f3f4f6;
  padding: 6px 10px;
  border-radius: 8px;
  margin-top: 4px;
`;

const AddressBox = styled.div`
  border: 1px dashed #e5e7eb;
  border-radius: 10px;
  padding: 12px;
  color: #4b5563;
  font-size: 13px;

  p {
    margin-top: 6px;
    line-height: 1.5;
  }
`;

const Summary = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  margin-top: 8px;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #374151;
  padding: 6px 0;

  &.total {
    font-size: 16px;
    font-weight: 700;
    color: #b45309;
  }
`;

const Divider = styled.div`
  height: 1px;
  background: #f3f4f6;
  margin: 4px 0;
`;

const FreeText = styled.span`
  color: #f97316;
  font-weight: 700;
`;

const ContentGrid = styled.div`
  width: min(1200px, 92vw);
  margin: 0 auto;
  padding: 16px 0 40px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;

  @media (min-width: 960px) {
    grid-template-columns: 3fr 1.4fr;
    align-items: start;
  }
`;

const MainColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Aside = styled.div`
  position: sticky;
  top: 90px;
  align-self: start;
`;

const SummaryCard = styled.div`
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.08);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SummaryHead = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #111827;
`;

const PayButton = styled.button`
  height: 52px;
  border-radius: 10px;
  border: none;
  background: #111827;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;

  p {
    margin: 4px 0;
    color: #4b5563;
    font-size: 13px;
  }

  .address {
    color: #6b7280;
  }
`;

const EditLink = styled.button`
  border: none;
  background: transparent;
  color: #2563eb;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
`;

const ContactCard = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
  align-items: center;
`;

const Label = styled.span`
  display: block;
  font-size: 12px;
  color: #6b7280;
`;

const Input = styled.input`
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
`;

const Hint = styled.p`
  grid-column: 1 / -1;
  margin: 4px 0 0;
  font-size: 12px;
  color: #6b7280;
`;

const EmptyPage = styled.div`
  padding: 60px 20px;
  text-align: center;
  color: #6b7280;
`;

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 900;
`;

const ModalCard = styled.div`
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: min(420px, 92vw);
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.2);
  z-index: 901;
`;

const ModalTitle = styled.h4`
  margin: 0 0 10px;
  font-size: 18px;
`;

const AccountBox = styled.div`
  border: 1px dashed #d1d5db;
  border-radius: 10px;
  padding: 12px;
  margin: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const AccountNo = styled.span`
  font-size: 17px;
  font-weight: 700;
`;

const ModalActions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 16px;
`;

const ModalButton = styled.button<{ $variant?: 'ghost' }>`
  height: 48px;
  border-radius: 10px;
  border: ${(p) => (p.$variant === 'ghost' ? '1px solid #d1d5db' : 'none')};
  background: ${(p) => (p.$variant === 'ghost' ? '#fff' : '#111827')};
  color: ${(p) => (p.$variant === 'ghost' ? '#111827' : '#fff')};
  font-weight: 700;
  cursor: pointer;
`;
