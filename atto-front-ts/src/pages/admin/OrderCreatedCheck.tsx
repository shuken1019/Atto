import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const OrderCreatedCheck: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Page>
      <TopRow>
        <BackBtn type="button" onClick={() => navigate('/admin/orders')}>← 주문 목록으로</BackBtn>
        <h2>생성된 주문 확인</h2>
      </TopRow>

      <Card>
        <CardHeader>
          <h3>생성된 주문</h3>
          <span>0건</span>
        </CardHeader>
        <Empty>
          <Doc />
          <p>생성된 주문이 없습니다.</p>
        </Empty>
      </Card>
    </Page>
  );
};

export default OrderCreatedCheck;

const Page = styled.div`
  margin: -40px;
  min-height: 100vh;
  background: #dfe4ec;
  padding: 30px;
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;

  h2 {
    font-size: 20px;
    color: #111827;
    font-weight: 800;
  }
`;

const BackBtn = styled.button`
  border: none;
  background: transparent;
  color: #4b5563;
  font-size: 15px;
  cursor: pointer;
`;

const Card = styled.section`
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
`;

const CardHeader = styled.div`
  height: 64px;
  padding: 0 18px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 {
    font-size: 16px;
    color: #111827;
    font-weight: 700;
  }

  span {
    color: #6b7280;
    font-size: 13px;
  }
`;

const Empty = styled.div`
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;

  p {
    font-size: 15px;
    color: #6b7280;
  }
`;

const Doc = styled.div`
  width: 42px;
  height: 54px;
  border-radius: 10px;
  background: #d1d5db;
`;
