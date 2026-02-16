import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const mockProducts = [
  { id: 1, name: 'Relaxed Cardigan', category: '상의', price: 98000, stock: 12 },
  { id: 2, name: 'Wide Cotton Pants', category: '하의', price: 68000, stock: 5 },
  { id: 3, name: 'Soft Wool Muffler', category: '악세서리', price: 47000, stock: 0 },
];

const ProductManagement: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState(mockProducts);

  const handleDelete = (id: number, name: string) => {
    const confirmed = window.confirm(`"${name}" 상품을 삭제할까요?`);
    if (!confirmed) return;
    setProducts((prev) => prev.filter((product) => product.id !== id));
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
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>₩ {product.price.toLocaleString()}</td>
                <td>{product.stock}</td>
                <td>
                  <ActionBtn type="button" onClick={() => navigate(`/admin/products/${product.id}/edit`)}>
                    수정
                  </ActionBtn>
                  <ActionBtn type="button" $danger onClick={() => handleDelete(product.id, product.name)}>
                    삭제
                  </ActionBtn>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6}>등록된 상품이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </ProductTable>
      </TableWrap>
    </Container>
  );
};

export default ProductManagement;

const Container = styled.div`
  padding: 24px;
  background: #f7f5f0;
  min-height: 100vh;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const Title = styled.h2`
  font-size: 30px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 500;
`;

const TableWrap = styled.div`
  background: #fff;
  border: 1px solid #ece7de;
  padding: 4px 0;
  overflow-x: auto;
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

const ActionBtn = styled.button<{ $danger?: boolean }>`
  border: 1px solid ${(props) => (props.$danger ? '#e2b5b5' : '#d9d9d9')};
  background: #fff;
  color: ${(props) => (props.$danger ? '#d14b4b' : '#333')};
  font-size: 13px;
  cursor: pointer;
  height: 34px;
  padding: 0 10px;
  margin-right: 10px;
`;
