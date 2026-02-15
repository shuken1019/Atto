import React, { useState } from 'react';
import styled from 'styled-components';
import { Link, useParams } from 'react-router-dom';

const ExchangeRequest: React.FC = () => {
  const { orderNo } = useParams<{ orderNo: string }>();
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');

  const handleSubmit = () => {
    if (!reason.trim()) {
      alert('교환 사유를 입력해주세요.');
      return;
    }

    alert('교환 요청이 접수되었습니다.');
  };

  return (
    <Container>
      <TopRow>
        <Title>교환요청</Title>
        <BackLink to={orderNo ? `/mypage/orders/${orderNo}` : '/mypage/orders'}>주문상세로</BackLink>
      </TopRow>

      <Section>
        <MetaText>주문번호: {orderNo ?? '-'}</MetaText>
        <FieldGroup>
          <Label>교환 사유</Label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="예: 사이즈 변경" />
        </FieldGroup>
        <FieldGroup>
          <Label>상세 내용</Label>
          <TextArea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="요청하실 내용을 입력해주세요."
          />
        </FieldGroup>
        <SubmitButton type="button" onClick={handleSubmit}>
          교환 요청하기
        </SubmitButton>
      </Section>
    </Container>
  );
};

export default ExchangeRequest;

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

const TextArea = styled.textarea`
  border: 1px solid #ddd;
  padding: 10px 12px;
  font-size: 14px;
  min-height: 120px;
  resize: vertical;

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
