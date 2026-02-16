import React, { useState } from 'react';
import styled from 'styled-components';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

type CreatedOrderDetailState = {
  orderNo?: string;
  buyerName?: string;
  productName?: string;
  quantity?: number;
  amount?: number;
  createdAt?: string;
};

const OrderCreatedDetail: React.FC = () => {
  const navigate = useNavigate();
  const { orderNo } = useParams();
  const location = useLocation();
  const state = (location.state ?? {}) as CreatedOrderDetailState;
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [activeSummaryTab, setActiveSummaryTab] = useState<'전체' | '주문' | '취소' | '반품/교환'>('전체');

  const detail = {
    orderNo: state.orderNo || orderNo || '202602164672089',
    buyerName: state.buyerName || '관리자',
    productName: state.productName || 'round dot cup',
    quantity: state.quantity ?? 1,
    amount: state.amount ?? 14000,
    createdAt: state.createdAt || '2026년 02월 16일 생성',
    phone: '010-9092-3497',
    address: '(16016) 경기 의왕시 백운호수로1길 9 (학의동, 백운밸리 풍경채 레이크포레 4단지 아파트)',
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) return;

    const printHtml = `
      <!doctype html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8" />
        <title>주문서 인쇄</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; font-family: "Noto Sans KR", sans-serif; color: #111827; padding: 28px 36px; }
          h1 { margin: 0 0 4px; font-size: 26px; font-weight: 800; }
          .site { margin: 0 0 22px; font-size: 15px; color: #374151; }
          .meta { display: grid; grid-template-columns: 90px 1fr; row-gap: 6px; max-width: 520px; margin-bottom: 26px; font-size: 14px; }
          .meta strong { font-weight: 700; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 22px; }
          .box-title { margin: 0 0 8px; font-size: 18px; font-weight: 800; }
          .line { margin: 0; font-size: 14px; line-height: 1.7; color: #1f2937; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 10px 8px; font-size: 14px; border-bottom: 1px solid #d1d5db; text-align: left; }
          th { border-top: 2px solid #111827; font-weight: 700; }
          th:last-child, td:last-child { text-align: right; }
          .sum td { font-weight: 800; }
        </style>
      </head>
      <body>
        <h1>주문서</h1>
        <p class="site">상품번호 ${detail.orderNo}</p>
        <div class="meta">
          <strong>주문번호</strong><span>${detail.orderNo}</span>
          <strong>주문일자</strong><span>${detail.createdAt}</span>
          <strong>결제수단</strong><span>미정</span>
        </div>
        <div class="info-grid">
          <div>
            <h3 class="box-title">배송정보</h3>
            <p class="line">${detail.address}</p>
            <p class="line">${detail.phone}</p>
            <p class="line">${detail.buyerName}</p>
          </div>
          <div>
            <h3 class="box-title">주문자 정보</h3>
            <p class="line">${detail.buyerName}</p>
            <p class="line">${detail.buyerName.toLowerCase()}1019@gmail.com</p>
            <p class="line">${detail.phone}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>주문 내역</th>
              <th>주문상태</th>
              <th>수량</th>
              <th>단가</th>
              <th>소계</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${detail.productName}</td>
              <td>상품준비</td>
              <td>${detail.quantity}</td>
              <td>${detail.amount.toLocaleString()}원</td>
              <td>${detail.amount.toLocaleString()}원</td>
            </tr>
            <tr class="sum">
              <td colspan="4">결제금액</td>
              <td>${detail.amount.toLocaleString()}원</td>
            </tr>
          </tbody>
        </table>
        <script>window.onload = function(){ window.print(); };</script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  };

  return (
    <Page>
      <TopHeader>
        <HeaderLeft>
          <BackInlineBtn type="button" onClick={() => navigate('/admin/orders')}>←</BackInlineBtn>
          <OrderTitle>{detail.orderNo}</OrderTitle>
          <StatusBadge $kind="ready">상품 준비</StatusBadge>
          <StatusBadge>결제수단 미정</StatusBadge>
        </HeaderLeft>
        <HeaderRight>
          <HeaderIconBtn type="button" onClick={() => setIsPrintModalOpen(true)} aria-label="인쇄">
            <PrintSvg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 8V4h10v4" />
              <rect x="5" y="10" width="14" height="7" rx="2" />
              <path d="M8 17h8v3H8z" />
            </PrintSvg>
          </HeaderIconBtn>
          <HeaderGhostBtn type="button">취소 접수</HeaderGhostBtn>
          <HeaderGhostBtn type="button">반품 접수</HeaderGhostBtn>
        </HeaderRight>
      </TopHeader>
      <CreatedAtText>{detail.createdAt}</CreatedAtText>

      <ContentGrid>
        <LeftCol>
          <TopNotice>
            <span>⚠</span>
            결제 금액에 대한 입금이 확인되어야 주문 상태를 업데이트할 수 있어요.
          </TopNotice>

          <SummaryTabs>
            <SummaryTab
              type="button"
              $active={activeSummaryTab === '전체'}
              onClick={() => setActiveSummaryTab('전체')}
            >
              전체 1
            </SummaryTab>
            <SummaryTab
              type="button"
              $active={activeSummaryTab === '주문'}
              onClick={() => setActiveSummaryTab('주문')}
            >
              주문 1
            </SummaryTab>
            <SummaryTab
              type="button"
              $active={activeSummaryTab === '취소'}
              onClick={() => setActiveSummaryTab('취소')}
            >
              취소 0
            </SummaryTab>
            <SummaryTab
              type="button"
              $active={activeSummaryTab === '반품/교환'}
              onClick={() => setActiveSummaryTab('반품/교환')}
            >
              반품/교환 0
            </SummaryTab>
          </SummaryTabs>

          {activeSummaryTab === '전체' || activeSummaryTab === '주문' ? (
            <OrderCard>
              <OrderHead>
                <h3>상품 준비 1</h3>
                <button type="button">⋮</button>
              </OrderHead>
              <OrderSub>
                #{detail.orderNo}-S1 · {detail.createdAt}
              </OrderSub>

              <OrderItem>
                <label>
                  <input type="checkbox" />
                </label>
                <Thumb />
                <ItemMeta>
                  <small>{detail.orderNo}-001</small>
                  <strong>{detail.productName}</strong>
                </ItemMeta>
                <ItemPrice>
                  <p>{detail.amount.toLocaleString()} 원 × {detail.quantity}</p>
                  <small>{detail.amount.toLocaleString()} 원</small>
                </ItemPrice>
                <ItemTotal>{detail.amount.toLocaleString()} 원</ItemTotal>
              </OrderItem>

              <OrderActions>
                <DisabledBtn type="button" disabled>배송 대기 처리</DisabledBtn>
              </OrderActions>
            </OrderCard>
          ) : (
            <OrderCard>
              <OrderHead>
                <h3>{activeSummaryTab} 0</h3>
                <button type="button">⋮</button>
              </OrderHead>
              <OrderSub>현재 {activeSummaryTab} 내역이 없어요.</OrderSub>
              <EmptyPanel>표시할 내역이 없습니다.</EmptyPanel>
            </OrderCard>
          )}
        </LeftCol>

        <RightCol>
          <InfoCard>
            <CardHead>
              <h4>결제정보</h4>
              <button type="button">⋮</button>
            </CardHead>
            <Rows>
              <Row><span>상품 금액</span><strong>{detail.amount.toLocaleString()} 원</strong></Row>
              <Row><span>할인</span><strong>0 원</strong></Row>
              <Row><span>적립금</span><strong>0 원</strong></Row>
              <Row><span>환불</span><strong>0 원</strong></Row>
            </Rows>
            <DueRow>
              <span>미결 금액</span>
              <strong>{detail.amount.toLocaleString()} 원</strong>
            </DueRow>
            <PaymentBtns>
              <OutlineBtn type="button">입금 확인 처리</OutlineBtn>
              <DangerBtn type="button">결제 요청 취소</DangerBtn>
            </PaymentBtns>
          </InfoCard>

          <InfoCard>
            <CardHead>
              <h4>구매자 정보</h4>
              <button type="button">⋮</button>
            </CardHead>
            <TextLine>{detail.buyerName.toLowerCase()}1019@gmail.com</TextLine>
            <TextLine>{detail.buyerName}</TextLine>
            <TextLine>{detail.phone}</TextLine>
          </InfoCard>

          <InfoCard>
            <CardHead>
              <h4>배송지 정보</h4>
              <button type="button">추가</button>
            </CardHead>
            <TextLine>{detail.buyerName}</TextLine>
            <TextLine>{detail.phone}</TextLine>
            <AddressText>{detail.address}</AddressText>
            <MutedLine>배송 메모 없음</MutedLine>
          </InfoCard>
        </RightCol>
      </ContentGrid>

      {isPrintModalOpen && (
        <>
          <PrintBackdrop onClick={() => setIsPrintModalOpen(false)} />
          <PrintModal>
            <PrintContent>
              <PrintHead>
                <h3>주문서 미리보기</h3>
                <button type="button" onClick={() => setIsPrintModalOpen(false)}>×</button>
              </PrintHead>
              <PrintOrderNo>상품번호 {detail.orderNo}</PrintOrderNo>
              <PrintInfoGrid>
                <div>
                  <h4>배송정보</h4>
                  <p>{detail.address}</p>
                  <p>{detail.phone}</p>
                  <p>{detail.buyerName}</p>
                </div>
                <div>
                  <h4>주문자 정보</h4>
                  <p>{detail.buyerName}</p>
                  <p>{detail.buyerName.toLowerCase()}1019@gmail.com</p>
                  <p>{detail.phone}</p>
                </div>
              </PrintInfoGrid>
              <PrintTable>
                <thead>
                  <tr>
                    <th>주문 내역</th>
                    <th>주문상태</th>
                    <th>수량</th>
                    <th>단가</th>
                    <th>소계</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{detail.productName}</td>
                    <td>상품준비</td>
                    <td>{detail.quantity}</td>
                    <td>{detail.amount.toLocaleString()}원</td>
                    <td>{detail.amount.toLocaleString()}원</td>
                  </tr>
                </tbody>
              </PrintTable>
            </PrintContent>
            <PrintActions>
              <PrintActionBtn type="button" $primary onClick={handlePrint}>인쇄</PrintActionBtn>
              <PrintActionBtn type="button" onClick={() => setIsPrintModalOpen(false)}>취소</PrintActionBtn>
            </PrintActions>
          </PrintModal>
        </>
      )}

    </Page>
  );
};

export default OrderCreatedDetail;

const Page = styled.div`
  background: #dfe4ec;
  min-height: calc(100vh - 80px);
  margin: -40px;
  padding: 16px 22px 22px;
`;

const TopHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const HeaderRight = styled.div`
  display: flex;
  gap: 8px;
`;

const HeaderIconBtn = styled.button`
  width: 46px;
  height: 46px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  background: #fff;
  color: #4b5563;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

const PrintSvg = styled.svg`
  width: 20px;
  height: 20px;
`;

const BackInlineBtn = styled.button`
  width: 34px;
  height: 34px;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 24px;
  cursor: pointer;
`;

const OrderTitle = styled.h2`
  font-size: 46px;
  line-height: 1;
  color: #111827;
  font-weight: 800;
`;

const StatusBadge = styled.span<{ $kind?: 'ready' }>`
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: ${(props) => (props.$kind === 'ready' ? '#fde68a' : '#e5e7eb')};
  color: ${(props) => (props.$kind === 'ready' ? '#92400e' : '#4b5563')};
  font-size: 14px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
`;

const HeaderGhostBtn = styled.button`
  height: 46px;
  padding: 0 16px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  background: #e5e7eb;
  color: #9ca3af;
  font-size: 15px;
  font-weight: 700;
`;

const CreatedAtText = styled.p`
  margin-top: 8px;
  margin-bottom: 12px;
  color: #6b7280;
  font-size: 15px;
`;

const TopNotice = styled.div`
  height: 58px;
  border-radius: 14px;
  background: #f5edc8;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 18px;
  color: #4b5563;
  font-size: 15px;
  margin-bottom: 14px;
`;

const SummaryTabs = styled.div`
  background: #d4d9e1;
  border-radius: 12px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding: 3px;
  gap: 4px;
  margin-bottom: 16px;
`;

const SummaryTab = styled.button<{ $active?: boolean }>`
  height: 46px;
  border: none;
  border-radius: 9px;
  background: ${(props) => (props.$active ? '#fff' : 'transparent')};
  color: #374151;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 16px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const LeftCol = styled.div``;

const RightCol = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const OrderCard = styled.section`
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #d9e0e8;
`;

const OrderHead = styled.div`
  height: 72px;
  padding: 0 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 {
    font-size: 16px;
    font-weight: 800;
    color: #111827;
  }

  button {
    border: none;
    background: transparent;
    color: #6b7280;
    font-size: 20px;
    cursor: pointer;
  }
`;

const OrderSub = styled.p`
  color: #6b7280;
  font-size: 14px;
  padding: 0 22px 14px;
`;

const OrderItem = styled.div`
  min-height: 120px;
  background: #f3f4f6;
  display: grid;
  grid-template-columns: 40px 60px 1fr auto auto;
  align-items: center;
  gap: 12px;
  padding: 0 22px;
`;

const Thumb = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
`;

const ItemMeta = styled.div`
  small {
    color: #6b7280;
    font-size: 12px;
  }

  strong {
    display: block;
    margin-top: 4px;
    color: #111827;
    font-size: 16px;
    font-weight: 700;
  }
`;

const ItemPrice = styled.div`
  p {
    font-size: 15px;
    color: #111827;
    font-weight: 700;
  }

  small {
    color: #9ca3af;
    font-size: 13px;
  }
`;

const ItemTotal = styled.strong`
  font-size: 15px;
  color: #111827;
  font-weight: 800;
`;

const OrderActions = styled.div`
  padding: 12px 22px 18px;
  display: flex;
  justify-content: flex-end;
`;

const EmptyPanel = styled.div`
  min-height: 180px;
  border-top: 1px solid #eef2f7;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 14px;
`;

const DisabledBtn = styled.button`
  height: 44px;
  padding: 0 20px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f3f4f6;
  color: #9ca3af;
  font-size: 14px;
  font-weight: 700;
`;

const InfoCard = styled.section`
  background: #fff;
  border-radius: 16px;
  padding: 18px 20px;
  border: 1px solid #d9e0e8;
`;

const CardHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;

  h4 {
    font-size: 19px;
    color: #111827;
    font-weight: 800;
  }

  button {
    border: none;
    background: transparent;
    color: #6b7280;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }
`;

const Rows = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  span {
    color: #4b5563;
    font-size: 13px;
  }

  strong {
    color: #111827;
    font-size: 14px;
  }
`;

const DueRow = styled(Row)`
  margin-top: 12px;
  margin-bottom: 12px;

  span {
    font-size: 16px;
    font-weight: 700;
    color: #111827;
  }

  strong {
    font-size: 18px;
    font-weight: 800;
  }
`;

const PaymentBtns = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const OutlineBtn = styled.button`
  height: 44px;
  border: 1px solid #cfd6e0;
  border-radius: 10px;
  background: #fff;
  color: #4b5563;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
`;

const DangerBtn = styled.button`
  height: 44px;
  border: none;
  border-radius: 10px;
  background: #ef4444;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
`;

const TextLine = styled.p`
  color: #0284c7;
  font-size: 15px;
  line-height: 1.7;
`;

const AddressText = styled.p`
  margin-top: 2px;
  color: #1f2937;
  font-size: 14px;
  line-height: 1.6;
`;

const MutedLine = styled.p`
  margin-top: 10px;
  color: #9ca3af;
  font-size: 13px;
`;

const PrintBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.35);
  z-index: 100;
`;

const PrintModal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(96vw, 1180px);
  height: min(90vh, 800px);
  background: #fff;
  border-radius: 14px;
  overflow: hidden;
  z-index: 110;
  display: flex;
  flex-direction: column;
`;

const PrintContent = styled.div`
  flex: 1;
  overflow: auto;
  padding: 26px 30px;
`;

const PrintHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;

  h3 {
    font-size: 22px;
    color: #111827;
    font-weight: 800;
  }

  button {
    border: none;
    background: transparent;
    color: #6b7280;
    font-size: 24px;
    cursor: pointer;
  }
`;

const PrintOrderNo = styled.p`
  color: #4b5563;
  font-size: 14px;
  margin-bottom: 16px;
`;

const PrintInfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 16px;

  h4 {
    font-size: 16px;
    color: #111827;
    font-weight: 800;
    margin-bottom: 6px;
  }

  p {
    color: #374151;
    font-size: 14px;
    line-height: 1.6;
  }
`;

const PrintTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    text-align: left;
    padding: 10px 8px;
    border-bottom: 1px solid #d1d5db;
    color: #111827;
    font-size: 14px;
  }

  th {
    border-top: 2px solid #111827;
    font-weight: 700;
  }

  th:last-child,
  td:last-child {
    text-align: right;
  }
`;

const PrintActions = styled.div`
  height: 68px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
`;

const PrintActionBtn = styled.button<{ $primary?: boolean }>`
  min-width: 84px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid ${(props) => (props.$primary ? '#2563eb' : '#d1d5db')};
  background: ${(props) => (props.$primary ? '#2563eb' : '#fff')};
  color: ${(props) => (props.$primary ? '#fff' : '#374151')};
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
`;
