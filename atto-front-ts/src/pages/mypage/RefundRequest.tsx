import React, { useState } from 'react';
import styled from 'styled-components';
import { Link, useParams } from 'react-router-dom';

const RefundRequest: React.FC = () => {
  const { orderNo } = useParams<{ orderNo: string }>();
  const [reason, setReason] = useState('');
  const [bankInfo, setBankInfo] = useState('');

  const handleSubmit = () => {
    if (!reason.trim()) {
      alert('환불 사유를 입력해주세요.');
      return;
    }

    alert('환불 요청이 접수되었습니다.');
  };

  return (
    <Container>
      <TopRow>
        <Title>환불요청</Title>
        <BackLink to={orderNo ? `/mypage/orders/${orderNo}` : '/mypage/orders'}>주문상세로</BackLink>
      </TopRow>

      <Section>
        <MetaText>주문번호: {orderNo ?? '-'}</MetaText>
        <FieldGroup>
          <Label>환불 사유</Label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="예: 단순 변심, 상품 하자"
          />
        </FieldGroup>
        <FieldGroup>
          <Label>환불 계좌 정보 (선택)</Label>
          <Input
            value={bankInfo}
            onChange={(e) => setBankInfo(e.target.value)}
            placeholder="예: OO은행 123-456-7890"
          />
        </FieldGroup>
        <SubmitButton type="button" onClick={handleSubmit}>
          환불 요청하기
        </SubmitButton>
      </Section>
    </Container>
  );
};

export default RefundRequest;

const Container = styled.div`
  width: 100%;
  max-width: 760px;
  font-family: 'Noto Sans KR', sans-serif;
`;

const TopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 30px;
`;

const Title = styled.h2`
  font-size: 24px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 500;
`;

const BackLink = styled(Link)`
  font-size: 13px;
  color: #666;
  border-bottom: 1px solid transparent;

  &:hover {
    color: #1a1a1a;
    border-bottom-color: #1a1a1a;
  }
`;

const Section = styled.section`
  border: 1px solid #e9e9e9;
  background: #fff;
  padding: 20px;
`;

const MetaText = styled.p`
  font-size: 13px;
  color: #777;
  margin-bottom: 16px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
`;

const Label = styled.label`
  font-size: 13px;
  color: #555;
`;

const Input = styled.input`
  border: 1px solid #ddd;
  padding: 10px 12px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #333;
  }
`;

const SubmitButton = styled.button`
  border: 1px solid #1a1a1a;
  background: #1a1a1a;
  color: #fff;
  font-size: 13px;
  padding: 10px 16px;
  cursor: pointer;
`;
