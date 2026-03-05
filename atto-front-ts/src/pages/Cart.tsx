import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import { getCartItems, removeCartItem, updateCartItemQuantity, type CartItem } from '../services/cartService';
import { createPendingOrder } from '../services/orderService';
import { showConfirm } from '../components/common/appDialog';

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCartIds, setSelectedCartIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [userLoggedIn, setUserLoggedIn] = useState(false);

  const load = async () => {
    try {
      const items = await getCartItems();
      setCartItems(items);
      setSelectedCartIds(items.map((item) => item.cartId));
    } catch (error) {
      const message = error instanceof Error ? error.message : '장바구니 조회 실패';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const rawUser = localStorage.getItem('attoUser');
    setUserLoggedIn(Boolean(rawUser));
  }, []);

  const handleQuantity = (cartId: number, type: 'plus' | 'minus') => {
    const current = cartItems.find((item) => item.cartId === cartId);
    if (!current) return;

    const newQty = type === 'plus' ? current.quantity + 1 : current.quantity - 1;
    if (newQty < 1) return;

    const previous = cartItems;
    setCartItems((prev) => prev.map((item) => (item.cartId === cartId ? { ...item, quantity: newQty } : item)));

    const run = async () => {
      try {
        await updateCartItemQuantity(cartId, newQty);
      } catch (error) {
        setCartItems(previous);
        const message = error instanceof Error ? error.message : '수량 변경 실패';
        alert(message);
      }
    };
    run();
  };

  const handleRemove = (cartId: number) => {
    const previous = cartItems;
    setCartItems((prev) => prev.filter((item) => item.cartId !== cartId));
    setSelectedCartIds((prev) => prev.filter((id) => id !== cartId));

    const run = async () => {
      try {
        await removeCartItem(cartId);
      } catch (error) {
        setCartItems(previous);
        const message = error instanceof Error ? error.message : '장바구니 삭제 실패';
        alert(message);
      }
    };
    run();
  };

  const toggleSelectItem = (cartId: number) => {
    setSelectedCartIds((prev) =>
      prev.includes(cartId) ? prev.filter((id) => id !== cartId) : [...prev, cartId],
    );
  };
  const allSelected = cartItems.length > 0 && selectedCartIds.length === cartItems.length;
  const handleToggleSelectAll = () => {
    setSelectedCartIds(allSelected ? [] : cartItems.map((item) => item.cartId));
  };
  const handleRemoveSelected = async () => {
    if (selectedCartIds.length === 0) return;

    const confirmed = await showConfirm(`선택한 ${selectedCartIds.length}개 상품을 삭제할까요?`);
    if (!confirmed) return;

    const selectedSet = new Set(selectedCartIds);
    const previousItems = cartItems;
    const previousSelected = selectedCartIds;

    setCartItems((prev) => prev.filter((item) => !selectedSet.has(item.cartId)));
    setSelectedCartIds([]);

    const results = await Promise.allSettled(previousSelected.map((cartId) => removeCartItem(cartId)));
    const failedCount = results.filter((result) => result.status === 'rejected').length;

    if (failedCount > 0) {
      setCartItems(previousItems);
      setSelectedCartIds(previousSelected);
      alert(`선택삭제 중 ${failedCount}개 항목 삭제에 실패했습니다.`);
    }
  };

  const selectedItems = cartItems.filter((item) => selectedCartIds.includes(item.cartId));
  const subTotal = selectedItems.reduce((acc, cur) => acc + cur.productPrice * cur.quantity, 0);
  const shippingFee = subTotal > 100000 ? 0 : 3000;
  const total = subTotal + shippingFee;

  const handleCheckout = async () => {
    if (checkoutPending) return;
    if (selectedItems.length === 0) return;
    if (!userLoggedIn) {
      const confirmed = await showConfirm('로그인이 필요합니다.');
      if (confirmed) {
        navigate('/login');
      }
      return;
    }

    setCheckoutPending(true);
    try {
      const { orderNo } = await createPendingOrder({
        totalAmount: total,
        memo: `[장바구니 주문] items=${selectedItems.length}`,
      });

      await Promise.allSettled(selectedItems.map((item) => removeCartItem(item.cartId)));
      setCartItems((prev) => prev.filter((item) => !selectedCartIds.includes(item.cartId)));
      setSelectedCartIds([]);
      alert(`주문이 생성되었습니다. (주문번호: ${orderNo})`);
      navigate('/mypage/orders');
    } catch (error) {
      const message = error instanceof Error ? error.message : '주문 생성 실패';
      alert(message);
    } finally {
      setCheckoutPending(false);
    }
  };

  if (loading) {
    return (
      <EmptyContainer>
        <h2>불러오는 중...</h2>
      </EmptyContainer>
    );
  }

  if (cartItems.length === 0) {
    return (
      <EmptyContainer>
        <h2>장바구니가 비어 있습니다.</h2>
        <p>상품을 담아주세요.</p>
        <ShopLink to="/shop">쇼핑하러 가기</ShopLink>
      </EmptyContainer>
    );
  }

  return (
    <Container>
      <Title>장바구니</Title>

      <CartLayout>
        <ItemsSection>
          <SelectionBar>
            <SelectionLeft>
              <SelectButton
                type="button"
                aria-label={allSelected ? '전체선택 해제' : '전체선택'}
                $checked={allSelected}
                onClick={handleToggleSelectAll}
              />
              <SelectAllLabel type="button" onClick={handleToggleSelectAll}>
                전체선택 ({selectedCartIds.length}/{cartItems.length})
              </SelectAllLabel>
            </SelectionLeft>
            <DeleteSelectedButton
              type="button"
              onClick={handleRemoveSelected}
              disabled={selectedCartIds.length === 0}
            >
              선택삭제
            </DeleteSelectedButton>
          </SelectionBar>

          <TableHeader>
            <span />
            <span>상품</span>
            <span>수량</span>
            <span>금액</span>
          </TableHeader>

          {cartItems.map((item) => (
            <CartItemRow key={item.cartId}>
              <SelectCell>
                <SelectButton
                  type="button"
                  aria-label={selectedCartIds.includes(item.cartId) ? '선택 해제' : '선택'}
                  $checked={selectedCartIds.includes(item.cartId)}
                  onClick={() => toggleSelectItem(item.cartId)}
                />
              </SelectCell>
              <ItemInfo>
                <img
                  src={
                    item.productThumbnail && item.productThumbnail.trim()
                      ? item.productThumbnail
                      : 'https://picsum.photos/seed/cart-placeholder/300/400'
                  }
                  alt={item.productName}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://picsum.photos/seed/cart-placeholder/300/400';
                  }}
                />
                <div>
                  <h4>{item.productName}</h4>
                  <p>
                    옵션: {item.colorName ?? `컬러-${item.colorId}`} / {item.sizeLabel}
                  </p>
                  <RemoveBtn onClick={() => handleRemove(item.cartId)}>삭제</RemoveBtn>
                </div>
              </ItemInfo>

              <QuantityControl>
                <button onClick={() => handleQuantity(item.cartId, 'minus')}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => handleQuantity(item.cartId, 'plus')}>+</button>
              </QuantityControl>

              <ItemPrice>₩{(item.productPrice * item.quantity).toLocaleString()}</ItemPrice>
            </CartItemRow>
          ))}
        </ItemsSection>

        <SummarySection>
          <SummaryBox>
            <h3>주문 요약</h3>
            <SummaryRow>
              <span>상품 합계</span>
              <span>₩{subTotal.toLocaleString()}</span>
            </SummaryRow>
            <SummaryRow>
              <span>배송비</span>
              <span>{shippingFee === 0 ? '무료' : `₩${shippingFee.toLocaleString()}`}</span>
            </SummaryRow>
            <Divider />
            <TotalRow>
              <span>총 결제금액</span>
              <span>₩{total.toLocaleString()}</span>
            </TotalRow>

            <CheckoutBtn onClick={handleCheckout} disabled={checkoutPending || selectedItems.length === 0}>
              {checkoutPending ? '처리 중...' : '구매하기'}
            </CheckoutBtn>
          </SummaryBox>
        </SummarySection>
      </CartLayout>
    </Container>
  );
};

export default Cart;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 20px 100px;
`;

const Title = styled.h2`
  text-align: center;
  font-size: 32px;
  font-family: 'Playfair Display', serif;
  margin-bottom: 60px;
  letter-spacing: 1px;
`;

const CartLayout = styled.div`
  display: flex;
  gap: 60px;

  @media (max-width: 900px) {
    flex-direction: column;
  }
`;

const ItemsSection = styled.div`
  flex: 2;
`;

const SelectionBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid #ececec;
  border-bottom: 1px solid #ececec;
  padding: 14px 0;
  margin-bottom: 16px;
`;

const SelectionLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SelectAllLabel = styled.button`
  border: none;
  background: transparent;
  padding: 0;
  font-size: 15px;
  color: #666;
  cursor: pointer;
`;

const DeleteSelectedButton = styled.button`
  border: none;
  background: transparent;
  padding: 0;
  font-size: 15px;
  color: #999;
  cursor: pointer;

  &:disabled {
    color: #cfcfcf;
    cursor: not-allowed;
  }
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 56px minmax(360px, 1.8fr) minmax(140px, 0.7fr) minmax(140px, 0.8fr);
  align-items: center;
  border-bottom: 1px solid #1a1a1a;
  padding-bottom: 15px;
  margin-bottom: 20px;
  font-size: 13px;
  text-transform: uppercase;
  color: #666;

  span:nth-child(3) {
    text-align: center;
  }
  span:nth-child(4) {
    text-align: center;
  }

  @media (max-width: 600px) {
    display: none;
  }
`;

const CartItemRow = styled.div`
  display: grid;
  grid-template-columns: 56px minmax(360px, 1.8fr) minmax(140px, 0.7fr) minmax(140px, 0.8fr);
  align-items: center;
  padding: 24px 0;
  border-bottom: 1px solid #eee;

  @media (max-width: 600px) {
    grid-template-columns: auto 1fr auto;
    grid-template-areas:
      'info info select'
      'qty qty price';
    gap: 12px 10px;
  }
`;

const ItemInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  min-width: 0;

  img {
    width: 90px;
    height: 120px;
    object-fit: cover;
    background-color: #f0f0f0;
  }

  div {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 6px;
  }

  h4 {
    font-size: 15px;
    font-weight: 500;
    color: #1a1a1a;
    word-break: keep-all;
  }
  p {
    font-size: 13px;
    color: #666;
  }

  @media (max-width: 600px) {
    grid-area: info;
  }
`;

const SelectCell = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  @media (max-width: 600px) {
    grid-area: select;
    justify-content: flex-end;
    align-items: flex-start;
    padding-top: 2px;
  }
`;

const SelectButton = styled.button<{ $checked: boolean }>`
  width: 24px;
  height: 24px;
  border: 2px solid ${(props) => (props.$checked ? '#1a1a1a' : '#bdbdbd')};
  background: ${(props) => (props.$checked ? '#1a1a1a' : '#fff')};
  border-radius: 5px;
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
  &::after {
    content: '';
    display: ${(props) => (props.$checked ? 'block' : 'none')};
    position: absolute;
    left: 7px;
    top: 2px;
    width: 6px;
    height: 12px;
    border: solid #fff;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
`;

const RemoveBtn = styled.button`
  background: none;
  border: none;
  text-align: left;
  padding: 0;
  font-size: 12px;
  color: #999;
  text-decoration: underline;
  cursor: pointer;
  margin-top: 5px;
  &:hover {
    color: #333;
  }
`;

const QuantityControl = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;

  button {
    width: 28px;
    height: 28px;
    border: 1px solid #ddd;
    background: #fff;
    cursor: pointer;
    &:hover {
      border-color: #333;
    }
  }

  span {
    font-size: 14px;
    min-width: 20px;
    text-align: center;
  }

  @media (max-width: 600px) {
    grid-area: qty;
    justify-content: flex-start;
  }
`;

const ItemPrice = styled.div`
  text-align: center;
  font-size: 15px;
  font-weight: 600;

  @media (max-width: 600px) {
    grid-area: price;
    text-align: center;
    align-self: center;
  }
`;

const SummarySection = styled.div`
  flex: 1;
`;

const SummaryBox = styled.div`
  background-color: #fff;
  padding: 30px;
  border: 1px solid #eee;
  position: sticky;
  top: 100px;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  font-size: 14px;
  color: #555;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid #eee;
  margin: 20px 0;
`;

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 30px;
`;

const CheckoutBtn = styled.button`
  width: 100%;
  padding: 18px;
  background-color: #1a1a1a;
  color: #fff;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: 1px;
  transition: background 0.3s;

  &:hover {
    background-color: #333;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const EmptyContainer = styled.div`
  text-align: center;
  padding: 100px 20px;

  h2 {
    font-size: 24px;
    font-family: 'Playfair Display', serif;
    margin-bottom: 10px;
  }
  p {
    color: #888;
    margin-bottom: 30px;
  }
`;

const ShopLink = styled(Link)`
  display: inline-block;
  padding: 15px 40px;
  background-color: #1a1a1a;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1px;
  transition: background 0.3s;
  &:hover {
    background-color: #333;
  }
`;
