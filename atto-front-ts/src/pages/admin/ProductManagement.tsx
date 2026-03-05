import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { deleteAdminProduct, getAdminProducts, toggleAdminProductLive, type AdminProductRow } from '../../services/productService';
import { showConfirm } from '../../components/common/appDialog';

const categoryLabel = (categoryId: number): string => {
  if (categoryId === 1) return 'outer';
  if (categoryId === 2) return 'top';
  if (categoryId === 3) return 'bottom';
  if (categoryId === 4) return 'acc';
  return String(categoryId);
};

const ProductManagement: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const rows = await getAdminProducts();
      setProducts(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'product list fetch failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleToggleLive = async (product: AdminProductRow) => {
    const productId = Number(product.productId);
    const nextLive = Number(product.isLive ?? 0) !== 1;

    try {
      setTogglingId(productId);
      await toggleAdminProductLive(productId, nextLive);
      setProducts((prev) => prev.map((row) => (Number(row.productId) === productId ? { ...row, isLive: nextLive ? 1 : 0 } : row)));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'live update failed');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (product: AdminProductRow) => {
    const productId = Number(product.productId);
    const ok = await showConfirm(`Delete product #${productId} (${product.name})?`);
    if (!ok) return;

    try {
      setDeletingId(productId);
      await deleteAdminProduct(productId);
      setProducts((prev) => prev.filter((row) => Number(row.productId) !== productId));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Container>
      <HeaderRow>
        <Title>상품 관리</Title>
      </HeaderRow>

      <TableWrap>
        <ProductTable>
          <thead>
            <tr>
              <th>ID</th>
              <th>상품명</th>
              <th>카테고리</th>
              <th>가격</th>
              <th>재고</th>
              <th>라이브</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7}>Loading...</td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td colSpan={7}>{error}</td>
              </tr>
            )}

            {!loading && !error &&
              products.map((product) => {
                const isLive = Number(product.isLive ?? 0) === 1;
                const productId = Number(product.productId);
                return (
                  <tr key={productId}>
                    <td>{productId}</td>
                    <td>{product.name}</td>
                    <td>{categoryLabel(Number(product.categoryId))}</td>
                    <td>₩{Number(product.price ?? 0).toLocaleString()}</td>
                    <td>{Number(product.totalStock ?? 0)}</td>
                    <td>
                      <LiveBtn type="button" $active={isLive} disabled={togglingId === productId} onClick={() => handleToggleLive(product)}>
                        {isLive ? '라이브 해제' : '라이브'}
                      </LiveBtn>
                    </td>
                    <td>
                      <ActionBtn type="button" onClick={() => navigate(`/admin/products/${productId}/edit`)}>
                        수정
                      </ActionBtn>
                      <DeleteBtn type="button" disabled={deletingId === productId} onClick={() => handleDelete(product)}>
                        삭제
                      </DeleteBtn>
                    </td>
                  </tr>
                );
              })}

            {!loading && !error && products.length === 0 && (
              <tr>
                <td colSpan={7}>등록된 상품이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </ProductTable>
      </TableWrap>

      <MobileList>
        {loading && <MobileEmpty>Loading...</MobileEmpty>}
        {!loading && error && <MobileEmpty>{error}</MobileEmpty>}

        {!loading && !error &&
          products.map((product) => {
            const isLive = Number(product.isLive ?? 0) === 1;
            const productId = Number(product.productId);
            return (
              <MobileCard key={`mobile-${productId}`}>
                <MobileCardTop>
                  <div>
                    <strong>{product.name}</strong>
                    <small>ID #{productId}</small>
                  </div>
                  <LiveBtn type="button" $active={isLive} disabled={togglingId === productId} onClick={() => handleToggleLive(product)}>
                    {isLive ? '라이브 해제' : '라이브'}
                  </LiveBtn>
                </MobileCardTop>

                <MobileMeta>
                  <span>카테고리</span><b>{categoryLabel(Number(product.categoryId))}</b>
                  <span>가격</span><b>₩{Number(product.price ?? 0).toLocaleString()}</b>
                  <span>재고</span><b>{Number(product.totalStock ?? 0)}</b>
                </MobileMeta>

                <MobileActions>
                  <ActionBtn type="button" onClick={() => navigate(`/admin/products/${productId}/edit`)}>
                    수정
                  </ActionBtn>
                  <DeleteBtn type="button" disabled={deletingId === productId} onClick={() => handleDelete(product)}>
                    삭제
                  </DeleteBtn>
                </MobileActions>
              </MobileCard>
            );
          })}

        {!loading && !error && products.length === 0 && <MobileEmpty>등록된 상품이 없습니다.</MobileEmpty>}
      </MobileList>
    </Container>
  );
};

export default ProductManagement;

const Container = styled.div`
  margin: -40px;
  padding: 24px;
  background: #f7f5f0;
  min-height: calc(100vh - 80px);

  @media (max-width: 760px) {
    padding: 12px;
  }
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
`;

const Title = styled.h2`
  font-size: 21px;
  font-family: 'Playfair Display', 'Noto Sans KR', sans-serif;
  font-weight: 500;
`;

const TableWrap = styled.div`
  background: #fff;
  border: 1px solid #ece7de;
  padding: 4px 0;
  overflow-x: auto;

  @media (max-width: 760px) {
    display: none;
  }
`;

const ProductTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 14px 12px;
    border-bottom: 1px solid #ece7de;
    text-align: left;
    font-size: 14px;
    white-space: nowrap;
  }

  th {
    background: #fcfbf8;
    color: #6f6f6f;
    font-weight: 600;
  }
`;

const ActionBtn = styled.button`
  border: 1px solid #d9d9d9;
  background: #fff;
  color: #333;
  font-size: 13px;
  cursor: pointer;
  height: 34px;
  padding: 0 10px;
  margin-right: 8px;
`;

const DeleteBtn = styled.button`
  border: 1px solid #e3b5b5;
  background: #fff;
  color: #b43a3a;
  font-size: 13px;
  cursor: pointer;
  height: 34px;
  padding: 0 10px;
`;

const LiveBtn = styled.button<{ $active: boolean }>`
  border: 1px solid ${(props) => (props.$active ? '#2a2a2a' : '#d9d9d9')};
  background: ${(props) => (props.$active ? '#2a2a2a' : '#fff')};
  color: ${(props) => (props.$active ? '#fff' : '#333')};
  font-size: 13px;
  cursor: pointer;
  height: 34px;
  padding: 0 10px;
`;

const MobileList = styled.div`
  display: none;

  @media (max-width: 760px) {
    display: grid;
    gap: 10px;
  }
`;

const MobileCard = styled.article`
  background: #fff;
  border: 1px solid #ece7de;
  padding: 12px;
`;

const MobileCardTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;

  strong {
    display: block;
    font-size: 16px;
    color: #111827;
  }

  small {
    display: block;
    margin-top: 2px;
    color: #6b7280;
    font-size: 12px;
  }
`;

const MobileMeta = styled.div`
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 6px 8px;
  padding: 10px;
  border: 1px solid #ece7de;
  background: #fcfbf8;
  margin-bottom: 10px;

  span {
    color: #6b7280;
    font-size: 12px;
  }

  b {
    color: #111827;
    font-size: 12px;
    font-weight: 600;
    word-break: break-all;
  }
`;

const MobileActions = styled.div`
  display: flex;
  gap: 8px;

  button {
    flex: 1;
    margin-right: 0;
  }
`;

const MobileEmpty = styled.div`
  border: 1px solid #ece7de;
  background: #fff;
  color: #6b7280;
  padding: 18px 12px;
  text-align: center;
  font-size: 14px;
`;
