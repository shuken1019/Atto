import React from 'react';
import styled from 'styled-components';

const mockProducts = [
  { id: 1, name: 'Relaxed Cardigan', category: '상의', price: 98000, stock: 12 },
  { id: 2, name: 'Wide Cotton Pants', category: '하의', price: 68000, stock: 5 },
  { id: 3, name: 'Soft Wool Muffler', category: '악세서리', price: 47000, stock: 0 },
];

const ProductManagement: React.FC = () => {
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
            {mockProducts.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>₩ {product.price.toLocaleString()}</td>
                <td>{product.stock}</td>
                <td>
                  <ActionBtn type="button">수정</ActionBtn>
                  <ActionBtn type="button" $danger>
                    삭제
                  </ActionBtn>
                </td>
              </tr>
            ))}
          </tbody>
        </ProductTable>
      </TableWrap>
    </Container>
  );
};

export default ProductManagement;

const Container = styled.div`
  padding: 20px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const Title = styled.h2`
  font-size: 24px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 500;
`;

const TableWrap = styled.div`
  overflow-x: auto;
`;

const ProductTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 14px 12px;
    border-bottom: 1px solid #eee;
    text-align: left;
    font-size: 14px;
    white-space: nowrap;
  }

  th {
    background: #fafafa;
    color: #666;
    font-weight: 600;
  }
`;

const ActionBtn = styled.button<{ $danger?: boolean }>`
  border: none;
  background: none;
  color: ${(props) => (props.$danger ? '#d14b4b' : '#1a1a1a')};
  font-size: 13px;
  cursor: pointer;
  text-decoration: underline;
  margin-right: 10px;
`;
