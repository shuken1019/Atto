import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

type Step = 1 | 2 | 3 | 4;

type SelectedProduct = {
  id: number;
  name: string;
  unitPrice: number;
  salePrice: number;
  quantity: number;
};

type ProductCandidate = {
  id: number;
  name: string;
  unitPrice: number;
};

type Member = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
};

const mockMembers: Member[] = [
  { id: 1, name: '관리자', email: 'shuken1019@gmail.com', phone: '01090923497', role: '관리자' },
  { id: 2, name: '김아토', email: 'kimatto@example.com', phone: '01022223333', role: '일반회원' },
  { id: 3, name: '이수아', email: 'sooa.lee@example.com', phone: '01044445555', role: '일반회원' },
];

const mockProducts: ProductCandidate[] = [
  { id: 1, name: 'round dot cup', unitPrice: 14000 },
  { id: 2, name: 'shine water cup', unitPrice: 14000 },
];

const mockAddressResults = [
  { road: '판교역로 166, 분당 주공', jibun: '백현동 532' },
  { road: '제주 첨단로 242', jibun: '영평동 2181' },
  { road: '분당 주공, 연수동 주공3차', jibun: '분당구 수내동 33-1' },
];

const OrderCreate: React.FC = () => {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [unlockedStep, setUnlockedStep] = useState<Step>(1);

  const [memberType, setMemberType] = useState<'member' | 'guest'>('member');
  const [memberKeyword, setMemberKeyword] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('user@example.com');

  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);

  const [shippingMethod, setShippingMethod] = useState('택배');
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [deliveryMemo, setDeliveryMemo] = useState('');
  const [shippingFeeType, setShippingFeeType] = useState<'prepaid' | 'collect' | 'free'>('collect');

  const [gradeDiscount, setGradeDiscount] = useState<'apply' | 'none'>('none');
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberQuery, setMemberQuery] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productQuery, setProductQuery] = useState('');
  const [pendingProductId, setPendingProductId] = useState<number | null>(null);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [nextSalePrice, setNextSalePrice] = useState('');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressQuery, setAddressQuery] = useState('');

  const [touched, setTouched] = useState({ step1: false, step2: false, step3: false });

  const step1Valid = buyerName.trim().length > 0 && buyerPhone.trim().length >= 9 && buyerEmail.trim().includes('@');
  const step2Valid = Boolean(selectedProduct);
  const step3Valid = receiverName.trim().length > 0 && receiverPhone.trim().length >= 9 && address1.trim().length > 0;
  const allValid = step1Valid && step2Valid && step3Valid;

  const totalAmount = useMemo(() => {
    if (!selectedProduct) return 0;
    return selectedProduct.salePrice * selectedProduct.quantity;
  }, [selectedProduct]);

  const filteredMembers = useMemo(() => {
    const keyword = memberQuery.trim().toLowerCase();
    if (!keyword) return mockMembers;
    return mockMembers.filter(
      (member) =>
        member.name.toLowerCase().includes(keyword) ||
        member.email.toLowerCase().includes(keyword),
    );
  }, [memberQuery]);

  const filteredProducts = useMemo(() => {
    const keyword = productQuery.trim().toLowerCase();
    if (!keyword) return mockProducts;
    return mockProducts.filter((product) => product.name.toLowerCase().includes(keyword));
  }, [productQuery]);

  const filteredAddresses = useMemo(() => {
    const keyword = addressQuery.trim().toLowerCase();
    if (!keyword) return [];
    return mockAddressResults.filter(
      (item) =>
        item.road.toLowerCase().includes(keyword) ||
        item.jibun.toLowerCase().includes(keyword),
    );
  }, [addressQuery]);

  const markTouched = (step: Step) => {
    if (step === 1) setTouched((prev) => ({ ...prev, step1: true }));
    if (step === 2) setTouched((prev) => ({ ...prev, step2: true }));
    if (step === 3) setTouched((prev) => ({ ...prev, step3: true }));
  };

  const canProceed = (step: Step) => {
    if (step === 1) return step1Valid;
    if (step === 2) return step2Valid;
    if (step === 3) return step3Valid;
    return true;
  };

  const goNext = () => {
    if (currentStep === 4) return;
    if (!canProceed(currentStep)) {
      markTouched(currentStep);
      return;
    }

    const next = (currentStep + 1) as Step;
    setCurrentStep(next);
    setUnlockedStep((prev) => (prev < next ? next : prev));
  };

  const goPrev = () => {
    if (currentStep === 1) return;
    setCurrentStep((currentStep - 1) as Step);
  };

  const handleCreateOrder = () => {
    if (currentStep !== 4 || !allValid) return;
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const randomPart = `${Math.floor(Math.random() * 1000000)}`.padStart(6, '0');
    const orderNo = `${datePart}${randomPart}`;
    const hour = now.getHours();
    const minute = String(now.getMinutes()).padStart(2, '0');
    const period = hour < 12 ? '오전' : '오후';
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    const createdAtLabel = `${now.getMonth() + 1}월 ${now.getDate()}일 ${period} ${String(hour12).padStart(2, '0')}:${minute}`;

    navigate('/admin/orders', {
      state: {
        openCreatedOrdersModal: true,
        createdOrder: {
          orderNo,
          buyerName: buyerName.trim() || '관리자',
          productName: selectedProduct?.name || '상품',
          quantity: selectedProduct?.quantity || 1,
          amount: totalAmount,
          createdAt: createdAtLabel,
        },
      },
    });
  };

  return (
    <Page>
      <ContentWrap>
        <BackLink type="button" onClick={() => navigate('/admin/orders')}>← 주문 목록</BackLink>
        <Title>주문 생성</Title>

        <Layout>
          <LeftCol>
            <StepSection>
              <StepHead>
                <StepCircle $state={currentStep > 1 ? 'done' : 'current'}>{currentStep > 1 ? '✓' : '1'}</StepCircle>
                <h3>주문 정보 입력</h3>
                {currentStep > 1 && <EditBtn type="button" onClick={() => setCurrentStep(1)}>수정</EditBtn>}
              </StepHead>
              {currentStep === 1 ? (
                <StepCard>
                  <FieldRow>
                    <FieldLabel>회원 정보</FieldLabel>
                    <FieldContent>
                      <InlineOptions>
                        <label><input type="radio" checked={memberType === 'member'} onChange={() => setMemberType('member')} /> 회원</label>
                        <label><input type="radio" checked={memberType === 'guest'} onChange={() => setMemberType('guest')} /> 비회원</label>
                      </InlineOptions>
                      <MemberSearchRow>
                        <input
                          value={memberKeyword}
                          onChange={(e) => setMemberKeyword(e.target.value)}
                          placeholder="회원 이름 또는 이메일을 입력해 주세요"
                        />
                        <MiniBtn type="button" onClick={() => setIsMemberModalOpen(true)}>찾아보기</MiniBtn>
                      </MemberSearchRow>
                    </FieldContent>
                  </FieldRow>

                  <FieldRow>
                    <FieldLabel>구매자 정보</FieldLabel>
                    <FieldContent>
                      <FieldGrid>
                        <Field>
                          <label>이름</label>
                          <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="입력해 주세요" />
                        </Field>
                        <Field>
                          <label>연락처</label>
                          <input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} placeholder="입력해 주세요" />
                        </Field>
                      </FieldGrid>
                      {touched.step1 && !step1Valid && <ErrorText>이름, 연락처, 이메일을 입력해 주세요.</ErrorText>}
                      <Field style={{ marginTop: 10 }}>
                        <label>이메일</label>
                        <input value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} placeholder="user@example.com" />
                      </Field>
                    </FieldContent>
                  </FieldRow>
                </StepCard>
              ) : (
                <SummaryCard>
                  <SummaryRow><span>회원 정보</span><strong>{memberType === 'member' ? '회원' : '비회원'}</strong></SummaryRow>
                  <SummaryRow><span>구매자 정보</span><strong>{buyerName} · {buyerPhone}</strong></SummaryRow>
                  <SummaryRow><span>이메일</span><strong>{buyerEmail}</strong></SummaryRow>
                </SummaryCard>
              )}
            </StepSection>

            {unlockedStep >= 2 ? (
              <StepSection>
                <StepHead>
                  <StepCircle $state={currentStep > 2 ? 'done' : currentStep === 2 ? 'current' : 'todo'}>{currentStep > 2 ? '✓' : '2'}</StepCircle>
                  <h3>상품 선택</h3>
                  {currentStep > 2 && <EditBtn type="button" onClick={() => setCurrentStep(2)}>수정</EditBtn>}
                </StepHead>
                {currentStep === 2 ? (
                  <StepCard>
                    <SearchRow>
                      <SearchInput placeholder="상품을 검색해 보세요" />
                      <SearchBtn
                        type="button"
                        onClick={() => {
                          setPendingProductId(null);
                          setProductQuery('');
                          setIsProductModalOpen(true);
                        }}
                      >
                        찾아보기
                      </SearchBtn>
                    </SearchRow>
                    {selectedProduct ? (
                      <ProductCard>
                        <ProductRow>
                          <ProductThumb />
                          <ProductMeta>
                            <strong>{selectedProduct.name}</strong>
                            <p>개당 {selectedProduct.salePrice.toLocaleString()}원</p>
                          </ProductMeta>
                          <QtyControl>
                            <QtyValue>{selectedProduct.quantity}</QtyValue>
                            <QtyButtons>
                              <QtyBtn
                                type="button"
                                onClick={() =>
                                  setSelectedProduct((prev) =>
                                    prev ? { ...prev, quantity: prev.quantity + 1 } : prev
                                  )
                                }
                              >
                                ▲
                              </QtyBtn>
                              <QtyBtn
                                type="button"
                                onClick={() =>
                                  setSelectedProduct((prev) =>
                                    prev ? { ...prev, quantity: Math.max(1, prev.quantity - 1) } : prev
                                  )
                                }
                              >
                                ▼
                              </QtyBtn>
                            </QtyButtons>
                          </QtyControl>
                          <ProductAmount>{(selectedProduct.salePrice * selectedProduct.quantity).toLocaleString()} 원</ProductAmount>
                        </ProductRow>
                        <ProductCardActions>
                          <PriceChangeBtn
                            type="button"
                            onClick={() => {
                              setNextSalePrice(String(selectedProduct.salePrice));
                              setIsPriceModalOpen(true);
                            }}
                          >
                            판매가 변경
                          </PriceChangeBtn>
                          <TrashBtn
                            type="button"
                            onClick={() => {
                              setSelectedProduct(null);
                            }}
                            aria-label="상품 삭제"
                          >
                            <TrashSvg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                              <path d="M4 7h16" />
                              <path d="M9 7V5h6v2" />
                              <path d="M7 7l1 12h8l1-12" />
                              <path d="M10 11v6M14 11v6" />
                            </TrashSvg>
                          </TrashBtn>
                        </ProductCardActions>
                      </ProductCard>
                    ) : (
                      <EmptyBox>
                        <BagIcon />
                        <p>상품을 추가해 보세요</p>
                      </EmptyBox>
                    )}
                    {touched.step2 && !step2Valid && <ErrorText>상품을 하나 이상 선택해 주세요.</ErrorText>}
                  </StepCard>
                ) : (
                  <SummaryCard>
                    <SummaryRow>
                      <span>선택 상품</span>
                      <strong>{selectedProduct ? `${selectedProduct.name} × ${selectedProduct.quantity}` : '없음'}</strong>
                    </SummaryRow>
                  </SummaryCard>
                )}
              </StepSection>
            ) : (
              <CollapsedStep>
                <StepCircle $state="todo">2</StepCircle>
                <h3>상품 선택</h3>
              </CollapsedStep>
            )}

            {unlockedStep >= 3 ? (
              <StepSection>
                <StepHead>
                  <StepCircle $state={currentStep > 3 ? 'done' : currentStep === 3 ? 'current' : 'todo'}>{currentStep > 3 ? '✓' : '3'}</StepCircle>
                  <h3>배송 설정</h3>
                  {currentStep > 3 && <EditBtn type="button" onClick={() => setCurrentStep(3)}>수정</EditBtn>}
                </StepHead>
                {currentStep === 3 ? (
                  <StepCard>
                    <FieldGrid>
                      <Field>
                        <label>배송 방식</label>
                        <select value={shippingMethod} onChange={(e) => setShippingMethod(e.target.value)}>
                          <option>택배</option>
                          <option>퀵배송</option>
                        </select>
                      </Field>
                      <Field>
                        <label>받는 분</label>
                        <input value={receiverName} onChange={(e) => setReceiverName(e.target.value)} placeholder="입력해 주세요" />
                      </Field>
                      <Field>
                        <label>연락처</label>
                        <input value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} placeholder="입력해 주세요" />
                      </Field>
                    </FieldGrid>
                    <Field>
                      <label>주소정보</label>
                      <AddressRow>
                        <input value={address1} onChange={(e) => setAddress1(e.target.value)} placeholder="도로명 혹은 지번 주소" />
                        <MiniBtn type="button" onClick={() => setIsAddressModalOpen(true)}>주소 찾기</MiniBtn>
                      </AddressRow>
                      <input value={address2} onChange={(e) => setAddress2(e.target.value)} placeholder="상세주소" style={{ marginTop: 8 }} />
                    </Field>
                    <Field>
                      <label>배송 메모</label>
                      <textarea rows={4} value={deliveryMemo} onChange={(e) => setDeliveryMemo(e.target.value)} placeholder="입력해 주세요" />
                    </Field>
                    <OptionRow>
                      <OptionLabel>배송비</OptionLabel>
                      <OptionContent>
                        <InlineOptions>
                          <label><input type="radio" checked={shippingFeeType === 'prepaid'} onChange={() => setShippingFeeType('prepaid')} /> 선불</label>
                          <label><input type="radio" checked={shippingFeeType === 'collect'} onChange={() => setShippingFeeType('collect')} /> 착불</label>
                          <label><input type="radio" checked={shippingFeeType === 'free'} onChange={() => setShippingFeeType('free')} /> 배송비 없음</label>
                        </InlineOptions>
                      </OptionContent>
                    </OptionRow>
                    {touched.step3 && !step3Valid && <ErrorText>받는 분, 연락처, 주소를 입력해 주세요.</ErrorText>}
                  </StepCard>
                ) : (
                  <SummaryCard>
                    <SummaryRow><span>배송 방식</span><strong>{shippingMethod}</strong></SummaryRow>
                    <SummaryRow><span>배송지</span><strong>{receiverName}, {receiverPhone}</strong></SummaryRow>
                    <SummaryRow><span>주소</span><strong>{address1 || '-'} {address2}</strong></SummaryRow>
                    <SummaryRow>
                      <span>배송비</span>
                      <strong>{shippingFeeType === 'prepaid' ? '선불' : shippingFeeType === 'collect' ? '착불' : '배송비 없음'}</strong>
                    </SummaryRow>
                  </SummaryCard>
                )}
              </StepSection>
            ) : (
              <CollapsedStep>
                <StepCircle $state="todo">3</StepCircle>
                <h3>배송 설정</h3>
              </CollapsedStep>
            )}

            {unlockedStep >= 4 ? (
              <StepSection>
                <StepHead>
                  <StepCircle $state={currentStep === 4 ? 'current' : 'todo'}>4</StepCircle>
                  <h3>할인 설정</h3>
                </StepHead>
                {currentStep === 4 ? (
                  <StepCard>
                    <OptionRow>
                      <OptionLabel>구매등급할인</OptionLabel>
                      <OptionContent>
                        <InlineOptions>
                          <label><input type="radio" checked={gradeDiscount === 'apply'} onChange={() => setGradeDiscount('apply')} /> 적용</label>
                          <label><input type="radio" checked={gradeDiscount === 'none'} onChange={() => setGradeDiscount('none')} /> 미적용</label>
                        </InlineOptions>
                      </OptionContent>
                    </OptionRow>
                    <Field>
                      <label>쿠폰 적용</label>
                      <select>
                        <option>사용 가능한 쿠폰이 없어요</option>
                      </select>
                    </Field>
                    <Field>
                      <label>적립금 사용</label>
                      <input value="0 원" readOnly />
                    </Field>
                  </StepCard>
                ) : (
                  <SummaryCard>
                    <SummaryRow><span>구매등급할인</span><strong>{gradeDiscount === 'apply' ? '적용' : '미적용'}</strong></SummaryRow>
                  </SummaryCard>
                )}
              </StepSection>
            ) : (
              <CollapsedStep>
                <StepCircle $state="todo">4</StepCircle>
                <h3>할인 설정</h3>
              </CollapsedStep>
            )}

            <WizardFooter>
              <FooterNavBtn type="button" disabled={currentStep === 1} onClick={goPrev}>이전</FooterNavBtn>
              <FooterNavBtn type="button" $primary disabled={currentStep === 4 || !canProceed(currentStep)} onClick={goNext}>다음</FooterNavBtn>
            </WizardFooter>
          </LeftCol>

          <RightCol>
            <AmountCard>
              <h4>금액</h4>
              <AmountRow>
                <span>합계</span>
                <strong>{totalAmount.toLocaleString()} 원</strong>
              </AmountRow>
              <AmountSub>
                <span>상품 금액</span>
                <span>{totalAmount.toLocaleString()} 원</span>
              </AmountSub>
            </AmountCard>
            <CreateBtn type="button" disabled={currentStep !== 4 || !allValid} onClick={handleCreateOrder}>주문 생성</CreateBtn>
          </RightCol>
        </Layout>
      </ContentWrap>

      {isMemberModalOpen && (
        <>
          <MemberModalBackdrop onClick={() => setIsMemberModalOpen(false)} />
          <MemberModal>
            <MemberModalHead>
              <h3>회원 목록</h3>
              <CloseBtn type="button" onClick={() => setIsMemberModalOpen(false)}>×</CloseBtn>
            </MemberModalHead>

            <MemberSearchInputWrap>
              <SearchMark>⌕</SearchMark>
              <input
                value={memberQuery}
                onChange={(e) => setMemberQuery(e.target.value)}
                placeholder="회원 이름 또는 이메일을 입력해 주세요"
              />
            </MemberSearchInputWrap>

            <MemberList>
              {filteredMembers.map((member) => (
                <MemberItem
                  key={member.id}
                  type="button"
                  onClick={() => {
                    setBuyerName(member.name);
                    setBuyerEmail(member.email);
                    setBuyerPhone(member.phone);
                    setMemberKeyword(member.email);
                    setMemberType('member');
                    setIsMemberModalOpen(false);
                  }}
                >
                  <MemberAvatar />
                  <MemberInfo>
                    <strong>{member.email}</strong>
                    <p>{member.role}</p>
                  </MemberInfo>
                </MemberItem>
              ))}
              {filteredMembers.length === 0 && <MemberEmpty>검색 결과가 없어요.</MemberEmpty>}
            </MemberList>
          </MemberModal>
        </>
      )}

      {isProductModalOpen && (
        <>
          <MemberModalBackdrop onClick={() => setIsProductModalOpen(false)} />
          <ProductModal>
            <MemberModalHead>
              <h3>상품추가</h3>
              <CloseBtn type="button" onClick={() => setIsProductModalOpen(false)}>×</CloseBtn>
            </MemberModalHead>

            <MemberSearchInputWrap>
              <SearchMark>⌕</SearchMark>
              <input
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder="상품을 검색해 보세요"
              />
            </MemberSearchInputWrap>

            <ProductModalList>
              {filteredProducts.map((product) => (
                <ProductModalItem key={product.id}>
                  <ProductModalTop>
                    <ProductModalThumb />
                    <ProductModalTitle>{product.name}</ProductModalTitle>
                    <ProductMetaBadge>1개 품목</ProductMetaBadge>
                  </ProductModalTop>
                  <ProductSelectRow
                    type="button"
                    onClick={() => setPendingProductId(product.id)}
                    $selected={pendingProductId === product.id}
                  >
                    <CheckSquare>{pendingProductId === product.id ? '✓' : ''}</CheckSquare>
                    <span>{product.name}</span>
                    <strong>{product.unitPrice.toLocaleString()}원</strong>
                  </ProductSelectRow>
                </ProductModalItem>
              ))}
              {filteredProducts.length === 0 && <MemberEmpty>검색 결과가 없어요.</MemberEmpty>}
            </ProductModalList>

            <ProductModalFooter>
              <ProductModalBtn type="button" onClick={() => setIsProductModalOpen(false)}>취소</ProductModalBtn>
              <ProductModalBtn
                type="button"
                $primary
                disabled={pendingProductId === null}
                onClick={() => {
                  const picked = mockProducts.find((product) => product.id === pendingProductId);
                  if (!picked) return;
                  setSelectedProduct({
                    id: picked.id,
                    name: picked.name,
                    unitPrice: picked.unitPrice,
                    salePrice: picked.unitPrice,
                    quantity: 1,
                  });
                  setIsProductModalOpen(false);
                }}
              >
                {pendingProductId === null ? '0개 상품추가' : '1개 상품추가'}
              </ProductModalBtn>
            </ProductModalFooter>
          </ProductModal>
        </>
      )}

      {isPriceModalOpen && selectedProduct && (
        <>
          <MemberModalBackdrop onClick={() => setIsPriceModalOpen(false)} />
          <PriceModal>
            <PriceModalTitle>판매가 변경</PriceModalTitle>

            <PricePreviewRow>
              <ProductThumb />
              <ProductMeta>
                <strong>{selectedProduct.name}</strong>
              </ProductMeta>
            </PricePreviewRow>

            <PriceInputRow>
              <input
                value={nextSalePrice}
                onChange={(e) => setNextSalePrice(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="판매가 입력"
              />
              <span>원</span>
            </PriceInputRow>

            <PriceResult>{Number(nextSalePrice || 0).toLocaleString()} 원</PriceResult>

            <PriceModalFooter>
              <ProductModalBtn type="button" onClick={() => setIsPriceModalOpen(false)}>
                취소
              </ProductModalBtn>
              <ProductModalBtn
                type="button"
                $primary
                disabled={Number(nextSalePrice || 0) <= 0}
                onClick={() => {
                  const parsed = Number(nextSalePrice || 0);
                  if (parsed <= 0) return;
                  setSelectedProduct((prev) => (prev ? { ...prev, salePrice: parsed } : prev));
                  setIsPriceModalOpen(false);
                }}
              >
                반영
              </ProductModalBtn>
            </PriceModalFooter>
          </PriceModal>
        </>
      )}

      {isAddressModalOpen && (
        <>
          <MemberModalBackdrop onClick={() => setIsAddressModalOpen(false)} />
          <AddressModal>
            <AddressModalHead>
              <h3>주소 검색</h3>
              <CloseBtn type="button" onClick={() => setIsAddressModalOpen(false)}>×</CloseBtn>
            </AddressModalHead>

            <AddressSearchRow>
              <input
                value={addressQuery}
                onChange={(e) => setAddressQuery(e.target.value)}
                placeholder="예) 판교역로 166, 분당 주공, 백현동 532"
              />
              <button type="button">⌕</button>
            </AddressSearchRow>

            <AddressBody>
              {addressQuery.trim().length === 0 ? (
                <TipBox>
                  <h4>tip</h4>
                  <p>아래와 같은 조합으로 검색을 하시면 더욱 정확한 결과가 검색됩니다.</p>
                  <p>도로명 + 건물번호</p>
                  <p className="sample">예) 판교역로 166, 제주 첨단로 242</p>
                  <p>지역명(동/리) + 번지</p>
                  <p className="sample">예) 백현동 532, 제주 영평동 2181</p>
                  <p>지역명(동/리) + 건물명(아파트명)</p>
                  <p className="sample">예) 분당 주공, 연수동 주공3차</p>
                </TipBox>
              ) : filteredAddresses.length === 0 ? (
                <AddressEmpty>검색 결과가 없습니다.</AddressEmpty>
              ) : (
                <AddressResults>
                  {filteredAddresses.map((item, idx) => (
                    <AddressItem
                      key={`${item.road}-${idx}`}
                      type="button"
                      onClick={() => {
                        setAddress1(item.road);
                        setAddress2(item.jibun);
                        setIsAddressModalOpen(false);
                      }}
                    >
                      <strong>{item.road}</strong>
                      <p>{item.jibun}</p>
                    </AddressItem>
                  ))}
                </AddressResults>
              )}
            </AddressBody>
          </AddressModal>
        </>
      )}
    </Page>
  );
};

export default OrderCreate;

const Page = styled.div`
  margin: -40px;
  min-height: 100vh;
  background: #dfe4ec;
  padding: 26px;
`;

const ContentWrap = styled.div`
  max-width: 1240px;
  margin: 0 auto;
`;

const BackLink = styled.button`
  border: none;
  background: transparent;
  color: #4b5563;
  font-size: 15px;
  cursor: pointer;
`;

const Title = styled.h2`
  margin-top: 10px;
  margin-bottom: 20px;
  font-size: 22px;
  color: #111827;
  font-weight: 800;
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 20px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const LeftCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const RightCol = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: sticky;
  top: 24px;
  height: fit-content;
`;

const StepSection = styled.section``;

const StepHead = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;

  h3 {
    font-size: 16px;
    font-weight: 800;
    color: #111827;
  }
`;

const CollapsedStep = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  h3 {
    font-size: 16px;
    color: #111827;
    font-weight: 700;
  }
`;

const StepCircle = styled.div<{ $state: 'done' | 'current' | 'todo' }>`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  background: ${(props) => (props.$state === 'done' ? '#b9f2c2' : props.$state === 'current' ? '#111827' : '#f3f4f6')};
  color: ${(props) => (props.$state === 'todo' ? '#9ca3af' : '#fff')};
  border: ${(props) => (props.$state === 'todo' ? '1px solid #d1d5db' : 'none')};
`;

const EditBtn = styled.button`
  margin-left: auto;
  border: none;
  background: transparent;
  color: #4b5563;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
`;

const StepCard = styled.div`
  background: #fff;
  border-radius: 16px;
  padding: 20px;
`;

const SummaryCard = styled(StepCard)`
  padding: 14px 18px;
`;

const SummaryRow = styled.div`
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 12px;
  align-items: center;
  padding: 5px 0;

  span {
    color: #4b5563;
    font-size: 13px;
    font-weight: 600;
  }

  strong {
    color: #111827;
    font-size: 14px;
  }
`;

const FieldRow = styled.div`
  display: grid;
  grid-template-columns: 130px 1fr;
  gap: 18px;
  margin-bottom: 12px;
`;

const FieldLabel = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  padding-top: 8px;
`;

const FieldContent = styled.div``;

const OptionRow = styled.div`
  display: grid;
  grid-template-columns: 130px 1fr;
  gap: 18px;
  align-items: center;
  margin-bottom: 12px;
`;

const OptionLabel = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #111827;
`;

const OptionContent = styled.div`
  min-height: 38px;
  display: flex;
  align-items: center;
`;

const InlineOptions = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;

  label {
    display: inline-flex;
    gap: 6px;
    font-size: 14px;
    color: #1f2937;
    align-items: center;
  }
`;

const MemberSearchRow = styled.div`
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1fr 100px;
  gap: 8px;

  input {
    width: 100%;
    border: 1px solid #cfd6e0;
    border-radius: 12px;
    height: 46px;
    padding: 0 12px;
    font-size: 14px;
    background: #f8fafc;
  }
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  margin-bottom: 10px;

  label {
    display: block;
    margin-bottom: 7px;
    font-size: 14px;
    font-weight: 700;
    color: #111827;
  }

  input,
  select,
  textarea {
    width: 100%;
    border: 1px solid #cfd6e0;
    border-radius: 12px;
    padding: 12px 14px;
    font-size: 14px;
    background: #fff;
  }

  textarea {
    resize: vertical;
  }
`;

const ErrorText = styled.p`
  margin-top: 6px;
  font-size: 13px;
  color: #ef4444;
`;

const AddressRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 112px;
  gap: 8px;
`;

const MiniBtn = styled.button`
  height: 46px;
  border: 1px solid #cfd6e0;
  border-radius: 10px;
  background: #fff;
  color: #374151;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
`;

const SearchRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 120px;
  gap: 10px;
`;

const SearchInput = styled.input`
  width: 100%;
  border: 1px solid #cfd6e0;
  border-radius: 12px;
  height: 52px;
  padding: 0 14px;
  font-size: 14px;
`;

const SearchBtn = styled.button`
  height: 52px;
  border: 1px solid #cfd6e0;
  border-radius: 12px;
  background: #fff;
  font-size: 14px;
  font-weight: 700;
  color: #374151;
  cursor: pointer;
`;

const EmptyBox = styled.div`
  margin-top: 12px;
  height: 180px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;

  p {
    margin-top: 8px;
    font-size: 14px;
    font-weight: 600;
  }
`;

const ProductCard = styled.div`
  margin-top: 12px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 12px 12px 10px;
`;

const ProductRow = styled.div`
  display: grid;
  grid-template-columns: 56px 1fr 150px auto;
  gap: 12px;
  align-items: center;

  @media (max-width: 900px) {
    grid-template-columns: 56px 1fr;
  }
`;

const ProductThumb = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 10px;
  background: linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%);
`;

const ProductMeta = styled.div`
  strong {
    font-size: 15px;
    color: #111827;
  }

  p {
    margin-top: 4px;
    font-size: 13px;
    color: #4b5563;
  }
`;

const QtyControl = styled.div`
  width: 150px;
  height: 68px;
  border: 1px solid #d1d5db;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px 0 16px;
`;

const QtyValue = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #111827;
`;

const QtyButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const QtyBtn = styled.button`
  width: 30px;
  height: 26px;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 12px;
  cursor: pointer;
`;

const ProductAmount = styled.div`
  font-size: 17px;
  font-weight: 800;
  color: #111827;
`;

const ProductCardActions = styled.div`
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 14px;
`;

const PriceChangeBtn = styled.button`
  border: none;
  background: transparent;
  color: #4b5563;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
`;

const TrashBtn = styled.button`
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: #f3f4f6;
  color: #4b5563;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

const TrashSvg = styled.svg`
  width: 18px;
  height: 18px;
`;

const BagIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #d1d5db;
`;

const WizardFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const FooterNavBtn = styled.button<{ $primary?: boolean }>`
  min-width: 88px;
  height: 48px;
  border: 1px solid ${(props) => (props.$primary ? '#111827' : '#d1d5db')};
  border-radius: 12px;
  background: ${(props) => (props.$primary ? '#111827' : '#fff')};
  color: ${(props) => (props.$primary ? '#fff' : '#374151')};
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    border-color: #e5e7eb;
    background: #e5e7eb;
    color: #9ca3af;
    cursor: not-allowed;
  }
`;

const AmountCard = styled.div`
  background: #fff;
  border-radius: 16px;
  padding: 18px;

  h4 {
    font-size: 18px;
    font-weight: 800;
    color: #111827;
    margin-bottom: 14px;
  }
`;

const AmountRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;

  span {
    font-size: 14px;
    color: #1f2937;
    font-weight: 700;
  }

  strong {
    font-size: 17px;
    color: #111827;
  }
`;

const AmountSub = styled.div`
  background: #f3f4f6;
  border-radius: 10px;
  height: 74px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  color: #4b5563;
`;

const CreateBtn = styled.button`
  width: 100%;
  height: 62px;
  border: none;
  border-radius: 12px;
  background: #111827;
  color: #fff;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    background: #d1d5db;
    color: #9ca3af;
    cursor: not-allowed;
  }
`;

const MemberModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.22);
  z-index: 80;
`;

const MemberModal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(92vw, 540px);
  max-height: 82vh;
  background: #fff;
  border-radius: 20px;
  padding: 22px;
  overflow: auto;
  z-index: 90;
`;

const ProductModal = styled(MemberModal)`
  width: min(94vw, 760px);
  max-height: 90vh;
  padding: 24px;
`;

const PriceModal = styled(MemberModal)`
  width: min(92vw, 540px);
  padding: 24px;
`;

const PriceModalTitle = styled.h3`
  font-size: 17px;
  color: #111827;
  font-weight: 800;
  margin-bottom: 16px;
`;

const PricePreviewRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
`;

const PriceInputRow = styled.div`
  margin-top: 8px;
  height: 52px;
  border: 1px solid #cfd6e0;
  border-radius: 12px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;

  input {
    border: none;
    width: 100%;
    font-size: 16px;
    color: #111827;

    &:focus {
      outline: none;
    }
  }

  span {
    color: #6b7280;
    font-size: 16px;
    font-weight: 600;
  }
`;

const PriceResult = styled.div`
  margin-top: 16px;
  text-align: right;
  font-size: 22px;
  color: #111827;
  font-weight: 800;
`;

const PriceModalFooter = styled.div`
  margin-top: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

const MemberModalHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;

  h3 {
    font-size: 17px;
    font-weight: 800;
    color: #111827;
  }
`;

const CloseBtn = styled.button`
  border: none;
  background: transparent;
  color: #4b5563;
  font-size: 20px;
  cursor: pointer;
`;

const MemberSearchInputWrap = styled.div`
  height: 48px;
  border: 1px solid #e5e7eb;
  background: #f3f4f6;
  border-radius: 12px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;

  input {
    border: none;
    background: transparent;
    width: 100%;
    font-size: 14px;

    &:focus {
      outline: none;
    }
  }
`;

const SearchMark = styled.span`
  color: #6b7280;
  font-size: 18px;
`;

const MemberList = styled.div`
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ProductModalList = styled.div`
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 58vh;
  overflow: auto;
`;

const ProductModalItem = styled.div`
  border-bottom: 1px solid #eef2f7;
  padding-bottom: 10px;
`;

const ProductModalTop = styled.div`
  display: grid;
  grid-template-columns: 62px 1fr auto;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
`;

const ProductModalThumb = styled.div`
  width: 62px;
  height: 62px;
  border-radius: 14px;
  background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
`;

const ProductModalTitle = styled.strong`
  font-size: 17px;
  color: #111827;
`;

const ProductMetaBadge = styled.span`
  height: 36px;
  padding: 0 12px;
  border-radius: 18px;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const ProductSelectRow = styled.button<{ $selected?: boolean }>`
  width: 100%;
  border: none;
  background: ${(props) => (props.$selected ? '#f8fafc' : '#fff')};
  border-radius: 10px;
  padding: 10px 10px;
  display: grid;
  grid-template-columns: 36px 1fr auto;
  gap: 10px;
  align-items: center;
  text-align: left;
  cursor: pointer;

  span {
    font-size: 16px;
    color: #111827;
  }

  strong {
    font-size: 16px;
    color: #111827;
    font-weight: 700;
  }
`;

const CheckSquare = styled.div`
  width: 30px;
  height: 30px;
  border: 2px solid #c7ced8;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #111827;
  font-weight: 800;
`;

const MemberItem = styled.button`
  width: 100%;
  border: none;
  background: #fff;
  border-radius: 12px;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: #f8fafc;
  }
`;

const MemberAvatar = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #d1d5db;
`;

const MemberInfo = styled.div`
  strong {
    font-size: 15px;
    color: #111827;
  }

  p {
    margin-top: 2px;
    font-size: 13px;
    color: #6b7280;
  }
`;

const MemberEmpty = styled.div`
  height: 120px;
  border: 1px dashed #d1d5db;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 14px;
`;

const ProductModalFooter = styled.div`
  margin-top: 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

const ProductModalBtn = styled.button<{ $primary?: boolean }>`
  height: 62px;
  border-radius: 14px;
  border: 1px solid ${(props) => (props.$primary ? '#111827' : '#cfd6e0')};
  background: ${(props) => (props.$primary ? '#111827' : '#fff')};
  color: ${(props) => (props.$primary ? '#fff' : '#374151')};
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    border-color: #e5e7eb;
    background: #e5e7eb;
    color: #9ca3af;
    cursor: not-allowed;
  }
`;

const AddressModal = styled(MemberModal)`
  width: min(94vw, 760px);
  max-height: 84vh;
  padding: 0;
  overflow: hidden;
`;

const AddressModalHead = styled.div`
  height: 88px;
  padding: 0 26px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 {
    font-size: 20px;
    font-weight: 800;
    color: #111827;
  }
`;

const AddressSearchRow = styled.div`
  height: 80px;
  padding: 16px 22px;
  border-bottom: 1px solid #111827;
  display: grid;
  grid-template-columns: 1fr 46px;
  align-items: center;
  gap: 8px;

  input {
    border: none;
    font-size: 16px;
    color: #111827;

    &:focus {
      outline: none;
    }
  }

  button {
    border: none;
    background: transparent;
    color: #374151;
    font-size: 24px;
    cursor: pointer;
  }
`;

const AddressBody = styled.div`
  max-height: calc(84vh - 168px);
  overflow: auto;
  padding: 20px 22px;
`;

const TipBox = styled.div`
  h4 {
    font-size: 18px;
    font-weight: 800;
    color: #111827;
    margin-bottom: 8px;
  }

  p {
    font-size: 14px;
    color: #1f2937;
    line-height: 1.7;
  }

  .sample {
    color: #0284c7;
    margin-bottom: 8px;
  }
`;

const AddressResults = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const AddressItem = styled.button`
  border: 1px solid #d1d5db;
  border-radius: 12px;
  background: #fff;
  padding: 12px;
  text-align: left;
  cursor: pointer;

  &:hover {
    border-color: #94a3b8;
    background: #f8fafc;
  }

  strong {
    display: block;
    color: #111827;
    font-size: 15px;
  }

  p {
    margin-top: 4px;
    color: #6b7280;
    font-size: 13px;
  }
`;

const AddressEmpty = styled.div`
  height: 180px;
  border: 1px dashed #d1d5db;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 14px;
`;
