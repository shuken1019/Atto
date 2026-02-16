import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import { getCartItems, removeCartItem, updateCartItemQuantity, type CartItem } from '../services/cartService';

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const items = await getCartItems();
        setCartItems(items);
      } catch (error) {
        const message = error instanceof Error ? error.message : '장바구니 조회 실패';
        alert(message);
      } finally {
        setLoading(false);
      }
    };
    load();
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

  const handleCheckout = () => {
    alert('결제 기능은 다음 단계에서 연결합니다.');
    navigate('/');
  };

  const subTotal = cartItems.reduce((acc, cur) => acc + cur.productPrice * cur.quantity, 0);
  const shippingFee = subTotal > 100000 ? 0 : 3000;
  const total = subTotal + shippingFee;

  if (loading) {
    return (
      <EmptyContainer>
        <h2>Loading...</h2>
      </EmptyContainer>
    );
  }

  if (cartItems.length === 0) {
    return (
      <EmptyContainer>
        <h2>Your cart is empty.</h2>
        <p>장바구니가 비어있습니다.</p>
        <ShopLink to="/shop">GO SHOPPING</ShopLink>
      </EmptyContainer>
    );
  }

  return (
    <Container>
      <Title>SHOPPING CART</Title>

      <CartLayout>
        <ItemsSection>
          <TableHeader>
            <span>Product</span>
            <span>Quantity</span>
            <span>Price</span>
          </TableHeader>

          {cartItems.map((item) => (
            <CartItemRow key={item.cartId}>
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
                    Option: {item.colorName ?? `Color-${item.colorId}`} / {item.sizeLabel}
                  </p>
                  <RemoveBtn onClick={() => handleRemove(item.cartId)}>Remove</RemoveBtn>
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
            <h3>Order Summary</h3>
            <SummaryRow>
              <span>Subtotal</span>
              <span>₩{subTotal.toLocaleString()}</span>
            </SummaryRow>
            <SummaryRow>
              <span>Shipping</span>
              <span>{shippingFee === 0 ? 'Free' : `₩${shippingFee.toLocaleString()}`}</span>
            </SummaryRow>
            <Divider />
            <TotalRow>
              <span>Total</span>
              <span>₩{total.toLocaleString()}</span>
            </TotalRow>

            <CheckoutBtn onClick={handleCheckout}>CHECKOUT</CheckoutBtn>
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

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 0.6fr;
  align-items: center;
  border-bottom: 1px solid #1a1a1a;
  padding-bottom: 15px;
  margin-bottom: 20px;
  font-size: 13px;
  text-transform: uppercase;
  color: #666;

  span:nth-child(2) {
    text-align: center;
  }
  span:nth-child(3) {
    text-align: right;
  }

  @media (max-width: 600px) {
    display: none;
  }
`;

const CartItemRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 0.6fr;
  align-items: center;
  padding: 24px 0;
  border-bottom: 1px solid #eee;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const ItemInfo = styled.div`
  display: flex;
  gap: 20px;

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
  }
  p {
    font-size: 13px;
    color: #666;
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
`;

const ItemPrice = styled.div`
  text-align: right;
  font-size: 15px;
  font-weight: 600;

  @media (max-width: 600px) {
    text-align: left;
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

