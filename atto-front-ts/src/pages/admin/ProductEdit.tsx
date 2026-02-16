import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useNavigate, useParams } from 'react-router-dom';

type ProductRow = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
};

const mockProducts: ProductRow[] = [
  { id: 1, name: 'Relaxed Cardigan', category: '상의', price: 98000, stock: 12, description: '부드러운 터치감의 데일리 가디건' },
  { id: 2, name: 'Wide Cotton Pants', category: '하의', price: 68000, stock: 5, description: '여유로운 핏의 코튼 팬츠' },
  { id: 3, name: 'Soft Wool Muffler', category: '악세서리', price: 47000, stock: 0, description: '포근한 울 머플러' },
];

const ProductEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const product = useMemo(() => {
    const numericId = Number(id);
    return mockProducts.find((item) => item.id === numericId) ?? null;
  }, [id]);

  const [formData, setFormData] = useState(() => ({
    name: product?.name ?? '',
    category: product?.category ?? '상의',
    price: String(product?.price ?? 0),
    stock: String(product?.stock ?? 0),
    description: product?.description ?? '',
  }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    alert('상품 수정이 저장되었습니다. (목업)');
    navigate('/admin/products');
  };

  if (!product) {
    return (
      <Container>
        <Title>상품을 찾을 수 없습니다.</Title>
        <BackBtn type="button" onClick={() => navigate('/admin/products')}>목록으로 돌아가기</BackBtn>
      </Container>
    );
  }

  return (
    <Container>
      <HeaderRow>
        <Title>상품 수정 #{product.id}</Title>
        <BackBtn type="button" onClick={() => navigate('/admin/products')}>목록으로</BackBtn>
      </HeaderRow>

      <Form>
        <Field>
          <Label>상품명</Label>
          <Input name="name" value={formData.name} onChange={handleChange} />
        </Field>

        <Grid>
          <Field>
            <Label>카테고리</Label>
            <Select name="category" value={formData.category} onChange={handleChange}>
              <option value="상의">상의</option>
              <option value="하의">하의</option>
              <option value="아우터">아우터</option>
              <option value="악세서리">악세서리</option>
            </Select>
          </Field>

          <Field>
            <Label>가격 (원)</Label>
            <Input name="price" type="number" value={formData.price} onChange={handleChange} />
          </Field>

          <Field>
            <Label>재고</Label>
            <Input name="stock" type="number" value={formData.stock} onChange={handleChange} />
          </Field>
        </Grid>

        <Field>
          <Label>설명</Label>
          <TextArea name="description" rows={5} value={formData.description} onChange={handleChange} />
        </Field>

        <ButtonRow>
          <CancelBtn type="button" onClick={() => navigate('/admin/products')}>취소</CancelBtn>
          <SaveBtn type="button" onClick={handleSave}>수정 저장</SaveBtn>
        </ButtonRow>
      </Form>
    </Container>
  );
};

export default ProductEdit;

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
  margin-bottom: 20px;
`;

const Title = styled.h2`
  font-size: 24px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 500;
`;

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 920px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: #4b5563;
`;

const Input = styled.input`
  width: 100%;
  height: 42px;
  border: 1px solid #d1d5db;
  padding: 0 12px;
  font-size: 14px;
`;

const Select = styled.select`
  width: 100%;
  height: 42px;
  border: 1px solid #d1d5db;
  padding: 0 12px;
  font-size: 14px;
`;

const TextArea = styled.textarea`
  width: 100%;
  border: 1px solid #d1d5db;
  padding: 10px 12px;
  font-size: 14px;
  resize: vertical;
`;

const ButtonRow = styled.div`
  margin-top: 6px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const BackBtn = styled.button`
  height: 36px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
  font-size: 13px;
  cursor: pointer;
`;

const CancelBtn = styled.button`
  height: 42px;
  padding: 0 16px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
`;

const SaveBtn = styled.button`
  height: 42px;
  padding: 0 16px;
  border: 1px solid #111827;
  background: #111827;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
`;
