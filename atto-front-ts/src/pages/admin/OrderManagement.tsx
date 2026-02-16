import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useLocation, useNavigate } from 'react-router-dom';

const tabItems = [
  '전체',
  '결제대기',
  '상품준비중',
  '배송대기',
  '배송중',
  '배송완료',
  '취소접수',
  '반품접수',
];

type CreatedOrder = {
  orderNo: string;
  buyerName: string;
  productName: string;
  quantity: number;
  amount: number;
  createdAt: string;
};

const initialCreatedOrders: CreatedOrder[] = [
  {
    orderNo: '202602164672089',
    buyerName: '관리자',
    productName: 'round dot cup',
    quantity: 1,
    amount: 14000,
    createdAt: '2월 16일 오후 03:31',
  },
  {
    orderNo: '202602165702210',
    buyerName: '관리자',
    productName: 'round dot cup',
    quantity: 1,
    amount: 14000,
    createdAt: '2월 16일 오후 02:39',
  },
];

const OrderManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('전체');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isCreatedOrdersModalOpen, setIsCreatedOrdersModalOpen] = useState(false);
  const [createdOrderQuery, setCreatedOrderQuery] = useState('');
  const [createdOrders, setCreatedOrders] = useState<CreatedOrder[]>(initialCreatedOrders);
  const location = useLocation();
  const navigate = useNavigate();
  const excelTemplatePath = '/invoice_excel_20260216053404.xlsx';

  const counts = useMemo(
    () => ({
      전체: 0,
      결제대기: 0,
      상품준비중: 0,
      배송대기: 0,
      배송중: 0,
      배송완료: 0,
      취소접수: 0,
      반품접수: 0,
    }),
    [],
  );

  const filteredCreatedOrders = useMemo(() => {
    const keyword = createdOrderQuery.trim().toLowerCase();
    if (!keyword) return createdOrders;
    return createdOrders.filter(
      (order) =>
        order.orderNo.toLowerCase().includes(keyword) ||
        order.buyerName.toLowerCase().includes(keyword),
    );
  }, [createdOrderQuery, createdOrders]);

  useEffect(() => {
    const state = (location.state ?? {}) as {
      openCreatedOrdersModal?: boolean;
      createdOrder?: CreatedOrder;
    };

    if (state.createdOrder) {
      setCreatedOrders((prev) => {
        if (prev.some((item) => item.orderNo === state.createdOrder?.orderNo)) return prev;
        return [state.createdOrder as CreatedOrder, ...prev];
      });
    }

    if (state.openCreatedOrdersModal) {
      setIsCreatedOrdersModalOpen(true);
    }

    if (state.createdOrder || state.openCreatedOrdersModal) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const downloadInvoiceTemplate = () => {
    const link = document.createElement('a');
    link.href = excelTemplatePath;
    link.download = 'invoice_excel_20260216053404.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Page>
      <TopHeader>
        <Title>주문</Title>
        <HeaderActions>
          <HeaderAction type="button" onClick={downloadInvoiceTemplate}>엑셀 다운로드</HeaderAction>
          <HeaderAction type="button" onClick={() => setIsBulkModalOpen(true)}>송장 일괄 등록</HeaderAction>
          <CreateActionWrap>
            <HeaderAction type="button" onClick={() => setIsCreateMenuOpen((prev) => !prev)}>
              주문 생성 ▾
            </HeaderAction>
            {isCreateMenuOpen && (
              <CreateMenu>
                <CreateMenuItem
                  type="button"
                  onClick={() => {
                    setIsCreateMenuOpen(false);
                    navigate('/admin/orders/create');
                  }}
                >
                  주문 생성
                </CreateMenuItem>
                <CreateMenuItem
                  type="button"
                  onClick={() => {
                    setIsCreateMenuOpen(false);
                    setIsCreatedOrdersModalOpen(true);
                  }}
                >
                  생성된 주문 확인
                </CreateMenuItem>
              </CreateMenu>
            )}
          </CreateActionWrap>
        </HeaderActions>
      </TopHeader>

      <NoticeCard>
        <NoticeIcon>i</NoticeIcon>
        <NoticeText>
          <p>[설 연휴 기간 시스템 점검 안내]</p>
          <p>- CJ대한통운(2/17 화 00:00~07:00), 한진택배(2/15 일 22:00~2/16 월 04:00) 전산 점검</p>
          <p>- 토스페이먼츠 가상계좌 입금은 2/16 월 00:00~08:00 동안 중단됩니다. 문의는 토스페이먼츠 고객센터로 부탁드립니다.</p>
        </NoticeText>
      </NoticeCard>

      <TabRow>
        {tabItems.map((tab) => (
          <StatusTab
            key={tab}
            type="button"
            $active={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab} <CountBadge $active={activeTab === tab}>{counts[tab as keyof typeof counts]}</CountBadge>
          </StatusTab>
        ))}
        <NewTabBtn type="button">+ 새 탭</NewTabBtn>
      </TabRow>

      <ContentCard>
        <CardTop>
          <SectionTitle>
            {activeTab} <CountCircle>{counts[activeTab as keyof typeof counts]}</CountCircle>
          </SectionTitle>

          <SearchTools>
            <SearchInputWrap>
              <SearchIcon>⌕</SearchIcon>
              <SearchInput placeholder="이름, 아이디, 연락처, 주문번호, 송장번호" />
            </SearchInputWrap>
            <ToolBtn type="button">☰</ToolBtn>
            <ToolBtn type="button">◫</ToolBtn>
            <ToolBtn type="button">⚙</ToolBtn>
          </SearchTools>
        </CardTop>

        <EmptyWrap>
          <EmptyDoc />
          <p>주문이 없어요</p>
        </EmptyWrap>
      </ContentCard>

      {isBulkModalOpen && (
        <>
          <ModalBackdrop
            onClick={() => {
              setIsBulkModalOpen(false);
              setIsCreateMenuOpen(false);
            }}
          />
          <BulkModal>
            <ModalHead>
              <h3>송장 일괄 등록</h3>
              <GuideLink type="button" onClick={() => setIsGuideModalOpen(true)}>엑셀 송장 등록 가이드</GuideLink>
            </ModalHead>

            <StepCard>
              <StepTitle>
                <StepNumber>1</StepNumber>
                엑셀 양식 다운로드
              </StepTitle>
              <StepDesc>엑셀 양식을 다운로드하고, 파일 내에 적힌 가이드에 맞춰 송장 정보를 작성해 주세요.</StepDesc>
              <StepActions>
                <StepBtn type="button" onClick={downloadInvoiceTemplate}>기본 양식 다운로드</StepBtn>
                <StepBtn type="button" disabled>목록에서 선택한 0건의 주문</StepBtn>
              </StepActions>
            </StepCard>

            <StepCard>
              <StepTitle>
                <StepNumber>2</StepNumber>
                엑셀 파일 업로드
              </StepTitle>
              <StepDesc>가이드에 맞춰 작성한 엑셀 파일을 업로드해 주세요.</StepDesc>
              <UploadBox as="label" htmlFor="bulk-invoice-file">
                <UploadIcon>＋</UploadIcon>
                <UploadText>{uploadedFileName || '파일을 선택하거나 끌어다 놓기'}</UploadText>
                <UploadSubText>최대 5MB의 XLSX, CSV 파일</UploadSubText>
              </UploadBox>
              <HiddenFileInput
                id="bulk-invoice-file"
                type="file"
                accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setUploadedFileName(file ? file.name : '');
                }}
              />
            </StepCard>

            <HistoryWrap>
              <HistoryTitle>엑셀 파일 등록 내역</HistoryTitle>
              <HistoryHelp>등록 실패 사유를 확인하려면 내역에서 파일을 다운로드해 주세요.</HistoryHelp>
              <HistoryList>등록한 내역 없음</HistoryList>
            </HistoryWrap>

            <ModalFooter>
              <FooterBtn type="button" onClick={() => setIsBulkModalOpen(false)}>취소</FooterBtn>
              <FooterBtn type="button" disabled>등록</FooterBtn>
            </ModalFooter>
          </BulkModal>
        </>
      )}

      {isGuideModalOpen && (
        <>
          <GuideBackdrop onClick={() => setIsGuideModalOpen(false)} />
          <GuideModal>
            <GuideHead>
              <h3>엑셀 송장 등록 가이드</h3>
              <CloseGuideBtn type="button" onClick={() => setIsGuideModalOpen(false)}>×</CloseGuideBtn>
            </GuideHead>

            <GuideSection>
              <GuideSectionTitle>1. 파일 작성 순서</GuideSectionTitle>
              <GuideText>다운로드한 엑셀 템플릿에 주문별 송장 정보를 입력한 뒤 저장해 업로드해 주세요.</GuideText>
              <GuideActions>
                <StepBtn type="button" onClick={downloadInvoiceTemplate}>양식 다운로드</StepBtn>
              </GuideActions>
            </GuideSection>

            <GuideSection>
              <GuideSectionTitle>2. 필수 입력 항목</GuideSectionTitle>
              <GuideTable>
                <thead>
                  <tr>
                    <th>컬럼명</th>
                    <th>설명</th>
                    <th>예시</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>주문번호</td>
                    <td>주문 상세에서 확인 가능한 주문 번호</td>
                    <td>202602164672089</td>
                  </tr>
                  <tr>
                    <td>택배사</td>
                    <td>배송 택배사명 또는 코드</td>
                    <td>CJ대한통운</td>
                  </tr>
                  <tr>
                    <td>송장번호</td>
                    <td>숫자/문자 포함 송장 번호</td>
                    <td>78912345670</td>
                  </tr>
                  <tr>
                    <td>발송일</td>
                    <td>YYYY-MM-DD 형식 권장</td>
                    <td>2026-02-16</td>
                  </tr>
                </tbody>
              </GuideTable>
            </GuideSection>

            <GuideSection>
              <GuideSectionTitle>3. 업로드 전 확인</GuideSectionTitle>
              <GuideBullet>파일 형식: `.xlsx`, `.csv`</GuideBullet>
              <GuideBullet>최대 용량: 5MB</GuideBullet>
              <GuideBullet>템플릿의 컬럼명은 수정하지 않고 값만 입력</GuideBullet>
              <GuideBullet>주문번호가 없거나 중복되면 등록 실패</GuideBullet>
            </GuideSection>

            <GuideFooter>
              <FooterBtn type="button" onClick={() => setIsGuideModalOpen(false)}>닫기</FooterBtn>
            </GuideFooter>
          </GuideModal>
        </>
      )}

      {isCreatedOrdersModalOpen && (
        <>
          <ModalBackdrop
            onClick={() => {
              setIsCreatedOrdersModalOpen(false);
              setIsCreateMenuOpen(false);
            }}
          />
          <CreatedModal>
            <CreatedModalHead>
              <div>
                <h3>관리자 생성 주문</h3>
                <p>생성된 주문은 결제가 완료돼야 주문 페이지에 노출돼요.</p>
              </div>
              <ExcelBtn type="button" onClick={downloadInvoiceTemplate}>엑셀 다운로드</ExcelBtn>
            </CreatedModalHead>

            <CreatedSearchWrap>
              <SearchIcon>⌕</SearchIcon>
              <input
                value={createdOrderQuery}
                onChange={(e) => setCreatedOrderQuery(e.target.value)}
                placeholder="주문번호, 구매자명"
              />
            </CreatedSearchWrap>

            <CreatedTableWrap>
              <CreatedTableHead>
                <span>주문번호·생성일</span>
                <span>구매자</span>
                <span>품목</span>
                <span>미결 금액</span>
              </CreatedTableHead>

              <CreatedTableBody>
                {filteredCreatedOrders.map((order, idx) => (
                  <CreatedRow
                    key={order.orderNo}
                    type="button"
                    $striped={idx % 2 === 1}
                    onClick={() => {
                      setIsCreatedOrdersModalOpen(false);
                      navigate(`/admin/orders/created/${order.orderNo}`, { state: order });
                    }}
                  >
                    <div>
                      <strong>{order.orderNo}</strong>
                      <p>{order.createdAt}</p>
                    </div>
                    <span>{order.buyerName}</span>
                    <ProductCell>
                      <ProductDot />
                      <em>{order.quantity}</em>
                    </ProductCell>
                    <strong>{order.amount.toLocaleString()}원</strong>
                  </CreatedRow>
                ))}
                {filteredCreatedOrders.length === 0 && <CreatedEmpty>생성된 주문이 없습니다.</CreatedEmpty>}
              </CreatedTableBody>
            </CreatedTableWrap>

            <CreatedModalFooter>
              <CloseBottomBtn type="button" onClick={() => setIsCreatedOrdersModalOpen(false)}>닫기</CloseBottomBtn>
            </CreatedModalFooter>
          </CreatedModal>
        </>
      )}
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

const TopHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;

  @media (max-width: 1100px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 800;
  color: #111827;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const CreateActionWrap = styled.div`
  position: relative;
`;

const HeaderAction = styled.button<{ $accent?: boolean }>`
  height: 46px;
  padding: 0 18px;
  border: 1px solid #d9d9d9;
  border-radius: 0;
  background: ${(props) => (props.$accent ? '#333' : '#fff')};
  color: ${(props) => (props.$accent ? '#fff' : '#333')};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
`;

const CreateMenu = styled.div`
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  width: 182px;
  background: #fff;
  border: 1px solid #ece7de;
  border-radius: 0;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  z-index: 30;
`;

const CreateMenuItem = styled.button`
  width: 100%;
  height: 54px;
  border: none;
  background: #fff;
  color: #1f2937;
  font-size: 15px;
  text-align: left;
  padding: 0 16px;
  cursor: pointer;

  &:hover {
    background: #f3f4f6;
  }
`;

const NoticeCard = styled.div`
  background: #fcfbf8;
  border-radius: 0;
  border: 1px solid #ece7de;
  padding: 20px;
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
`;

const NoticeIcon = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #333;
  color: #fff;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const NoticeText = styled.div`
  p {
    font-size: 14px;
    line-height: 1.6;
    color: #555;
  }
`;

const TabRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 14px;
`;

const StatusTab = styled.button<{ $active?: boolean }>`
  height: 48px;
  padding: 0 14px;
  border: 1px solid #d9d9d9;
  border-radius: 0;
  background: ${(props) => (props.$active ? '#333' : '#fff')};
  color: ${(props) => (props.$active ? '#fff' : '#333')};
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
`;

const CountBadge = styled.span<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  margin-left: 6px;
  border-radius: 0;
  background: ${(props) => (props.$active ? '#ffffff' : '#fcfbf8')};
  color: ${(props) => (props.$active ? '#333' : '#6f6f6f')};
  font-size: 13px;
  font-weight: 700;
`;

const NewTabBtn = styled.button`
  height: 44px;
  border: 1px solid #d9d9d9;
  background: #fff;
  color: #333;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
`;

const ContentCard = styled.section`
  background: #fff;
  border-radius: 0;
  border: 1px solid #ece7de;
  min-height: 360px;
`;

const CardTop = styled.div`
  padding: 20px;
  display: flex;
  justify-content: space-between;
  gap: 14px;

  @media (max-width: 1100px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SectionTitle = styled.h3`
  font-size: 20px;
  color: #111827;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CountCircle = styled.span`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #4b5563;
  font-size: 16px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const SearchTools = styled.div`
  display: flex;
  gap: 8px;
`;

const SearchInputWrap = styled.div`
  width: 520px;
  max-width: 100%;
  height: 50px;
  border: 1px solid #d9d9d9;
  border-radius: 0;
  display: flex;
  align-items: center;
  padding: 0 14px;
  gap: 10px;
`;

const SearchIcon = styled.span`
  color: #6b7280;
  font-size: 18px;
`;

const SearchInput = styled.input`
  border: none;
  flex: 1;
  font-size: 14px;

  &:focus {
    outline: none;
  }
`;

const ToolBtn = styled.button`
  width: 50px;
  height: 50px;
  border: 1px solid #d9d9d9;
  border-radius: 0;
  background: #fff;
  color: #4b5563;
  font-size: 18px;
  cursor: pointer;
`;

const EmptyWrap = styled.div`
  min-height: 210px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  gap: 10px;

  p {
    font-size: 16px;
    font-weight: 600;
  }
`;

const EmptyDoc = styled.div`
  width: 46px;
  height: 58px;
  border-radius: 9px;
  background: #d1d5db;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    right: 0;
    top: 0;
    width: 14px;
    height: 14px;
    background: #eceff3;
    clip-path: polygon(0 0, 100% 100%, 0 100%);
  }
`;

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.25);
  z-index: 80;
`;

const BulkModal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(96vw, 760px);
  max-height: 92vh;
  overflow: auto;
  border-radius: 0;
  background: #fff;
  border: 1px solid #ece7de;
  padding: 26px;
  z-index: 90;
`;

const ModalHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;

  h3 {
    font-size: 18px;
    font-weight: 800;
    color: #111827;
  }
`;

const GuideLink = styled.button`
  border: 1px solid #d9d9d9;
  background: #fff;
  color: #333;
  font-size: 14px;
  font-weight: 500;
  height: 40px;
  padding: 0 14px;
  cursor: pointer;
`;

const StepCard = styled.div`
  background: #fcfbf8;
  border-radius: 0;
  border: 1px solid #ece7de;
  padding: 18px;
  margin-bottom: 12px;
`;

const StepTitle = styled.h4`
  font-size: 17px;
  color: #111827;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StepNumber = styled.span`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #111827;
  color: #fff;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const StepDesc = styled.p`
  margin-top: 6px;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
`;

const StepActions = styled.div`
  margin-top: 14px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  @media (max-width: 780px) {
    grid-template-columns: 1fr;
  }
`;

const StepBtn = styled.button`
  height: 48px;
  border: 1px solid #d9d9d9;
  border-radius: 0;
  background: #fff;
  color: #333;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    background: #e5e7eb;
    color: #9ca3af;
    cursor: not-allowed;
  }
`;

const UploadBox = styled.label`
  margin-top: 12px;
  border: 1px dashed #d9d9d9;
  border-radius: 0;
  min-height: 176px;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
`;

const UploadIcon = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #9ca3af;
  color: #fff;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const UploadText = styled.p`
  font-size: 15px;
  font-weight: 700;
  color: #1f2937;
`;

const UploadSubText = styled.p`
  font-size: 13px;
  color: #9ca3af;
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const HistoryWrap = styled.div`
  margin-top: 14px;
`;

const HistoryTitle = styled.h4`
  font-size: 16px;
  font-weight: 800;
  color: #111827;
`;

const HistoryHelp = styled.p`
  margin-top: 6px;
  font-size: 13px;
  color: #6b7280;
`;

const HistoryList = styled.div`
  margin-top: 8px;
  height: 68px;
  border: 1px solid #d9d9d9;
  border-radius: 0;
  padding: 0 14px;
  display: flex;
  align-items: center;
  color: #9ca3af;
`;

const ModalFooter = styled.div`
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const FooterBtn = styled.button`
  min-width: 86px;
  height: 50px;
  border: 1px solid #d9d9d9;
  border-radius: 0;
  background: #fff;
  color: #333;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    background: #e5e7eb;
    color: #9ca3af;
    cursor: not-allowed;
  }
`;

const GuideBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.35);
  z-index: 100;
`;

const GuideModal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(94vw, 860px);
  max-height: 88vh;
  overflow: auto;
  background: #fff;
  border-radius: 0;
  z-index: 110;
  padding: 24px;
  border: 1px solid #ece7de;
`;

const GuideHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  h3 {
    font-size: 20px;
    font-weight: 800;
    color: #111827;
  }
`;

const CloseGuideBtn = styled.button`
  border: none;
  background: transparent;
  font-size: 26px;
  color: #6b7280;
  cursor: pointer;
`;

const GuideSection = styled.section`
  border: 1px solid #ece7de;
  border-radius: 0;
  padding: 14px;
  margin-bottom: 12px;
`;

const GuideSectionTitle = styled.h4`
  font-size: 16px;
  font-weight: 800;
  color: #111827;
  margin-bottom: 8px;
`;

const GuideText = styled.p`
  color: #4b5563;
  font-size: 14px;
  line-height: 1.6;
`;

const GuideActions = styled.div`
  margin-top: 10px;
  display: flex;
  gap: 8px;
`;

const GuideTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    border-bottom: 1px solid #e5e7eb;
    text-align: left;
    padding: 10px 8px;
    font-size: 13px;
    color: #1f2937;
    vertical-align: top;
  }

  th {
    background: #f8fafc;
    color: #4b5563;
    font-weight: 700;
  }
`;

const GuideBullet = styled.p`
  font-size: 14px;
  color: #374151;
  line-height: 1.6;

  &::before {
    content: '•';
    margin-right: 6px;
  }
`;

const GuideFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
`;

const CreatedModal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(96vw, 1120px);
  height: min(92vh, 1120px);
  border-radius: 0;
  background: #fff;
  border: 1px solid #ece7de;
  z-index: 90;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const CreatedModalHead = styled.div`
  min-height: 146px;
  padding: 32px 36px 24px;
  border-bottom: 1px solid #d1d5db;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;

  h3 {
    font-size: 22px;
    line-height: 1.12;
    font-weight: 800;
    color: #111827;
  }

  p {
    margin-top: 16px;
    color: #6b7280;
    font-size: 16px;
    line-height: 1.4;
  }
`;

const ExcelBtn = styled.button`
  height: 62px;
  padding: 0 28px;
  border: 1px solid #d9d9d9;
  border-radius: 0;
  background: #fff;
  color: #333;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
`;

const CreatedSearchWrap = styled.div`
  margin: 28px 36px 16px;
  height: 88px;
  border-radius: 0;
  background: #fcfbf8;
  border: 1px solid #ece7de;
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 12px;

  input {
    width: 100%;
    border: none;
    background: transparent;
    color: #111827;
    font-size: 15px;

    &:focus {
      outline: none;
    }
  }
`;

const CreatedTableWrap = styled.div`
  margin: 0 0 0;
  border-top: 1px solid #dbe2ea;
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
`;

const CreatedTableHead = styled.div`
  min-height: 66px;
  display: grid;
  grid-template-columns: 1.25fr 0.85fr 0.7fr 0.8fr;
  align-items: center;
  padding: 0 36px;
  gap: 12px;
  color: #6b7280;
  font-size: 14px;
  font-weight: 700;
`;

const CreatedTableBody = styled.div`
  flex: 1;
  overflow: auto;
`;

const CreatedRow = styled.button<{ $striped?: boolean }>`
  width: 100%;
  border: none;
  text-align: left;
  min-height: 104px;
  display: grid;
  grid-template-columns: 1.25fr 0.85fr 0.7fr 0.8fr;
  align-items: center;
  padding: 0 36px;
  gap: 12px;
  border-top: 1px solid #ece7de;
  background: ${(props) => (props.$striped ? '#fcfbf8' : '#fff')};
  cursor: pointer;

  &:hover {
    background: #f7f5f0;
  }

  div strong {
    display: block;
    font-size: 16px;
    font-weight: 800;
    color: #111827;
    line-height: 1.15;
  }

  div p {
    margin-top: 8px;
    color: #374151;
    font-size: 14px;
    line-height: 1.2;
  }

  > span {
    font-size: 16px;
    font-weight: 700;
    color: #1f2937;
  }

  > strong {
    justify-self: end;
    font-size: 16px;
    color: #111827;
    font-weight: 800;
  }
`;

const ProductCell = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;

  em {
    font-size: 16px;
    color: #1f2937;
    font-style: normal;
    font-weight: 700;
  }
`;

const ProductDot = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
`;

const CreatedEmpty = styled.div`
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 16px;
`;

const CreatedModalFooter = styled.div`
  margin-top: auto;
  height: 112px;
  padding: 24px 36px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  align-items: center;
`;

const CloseBottomBtn = styled.button`
  min-width: 96px;
  height: 62px;
  padding: 0 26px;
  border: 1px solid #d9d9d9;
  border-radius: 0;
  background: #fff;
  color: #333;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
`;
