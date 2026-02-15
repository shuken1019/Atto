import React from 'react';
import styled from 'styled-components';

const Dashboard: React.FC = () => {
  const lowStockItems = [
    { name: 'Relaxed Tate-shirt', option: 'Beige / M', stock: 2 },
    { name: 'Wide Cotton Pants', option: 'Black / S', stock: 0 },
  ];

  return (
    <Container>
      <Title>대시보드</Title>
      <AlertBox>
        <h3>재고 알림</h3>
        {lowStockItems.map((item) => (
          <AlertItem key={`${item.name}-${item.option}`} $isCritical={item.stock === 0}>
            <span>
              {item.name} ({item.option})
            </span>
            <strong>{item.stock === 0 ? '품절' : `${item.stock}개 남음`}</strong>
          </AlertItem>
        ))}
      </AlertBox>
    </Container>
  );
};

export default Dashboard;

const Container = styled.div`
  padding: 20px;
`;

const Title = styled.h2`
  font-size: 24px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 500;
  margin-bottom: 16px;
`;

const AlertBox = styled.div`
  background: #fff;
  padding: 25px;
  border: 1px solid #eee;
  border-left: 5px solid #e74c3c;

  h3 {
    margin-bottom: 10px;
    font-size: 16px;
    font-family: 'Noto Sans KR', sans-serif;
    font-weight: 500;
  }
`;

const AlertItem = styled.div<{ $isCritical: boolean }>`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f3f3f3;
  color: ${(props) => (props.$isCritical ? '#e74c3c' : '#333')};
  font-weight: ${(props) => (props.$isCritical ? 700 : 400)};
`;
