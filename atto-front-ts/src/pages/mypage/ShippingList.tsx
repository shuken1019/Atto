import React from 'react';
import styled from 'styled-components';

const ShippingList: React.FC = () => {
  return (
    <Container>
      <Title>Shipping Address</Title>
      <AddressCard>
        <Badge>기본 배송지</Badge>
        <Name>김아토</Name>
        <Phone>010-1234-5678</Phone>
        <Address>서울특별시 강남구 테헤란로 123, 아토빌딩 101호</Address>
        <ButtonGroup>
          <Button>수정</Button>
          <Button>삭제</Button>
        </ButtonGroup>
      </AddressCard>
      
      <AddButton>+ 새 배송지 추가</AddButton>
    </Container>
  );
};

export default ShippingList;

const Container = styled.div` width: 100%; max-width: 600px; `;
const Title = styled.h2` font-size: 24px; font-family: 'Playfair Display', serif; margin-bottom: 30px; border-bottom: 1px solid #ddd; padding-bottom: 15px; `;
const AddressCard = styled.div` border: 1px solid #ddd; padding: 24px; margin-bottom: 20px; position: relative; `;
const Badge = styled.span` background: #eee; font-size: 11px; padding: 4px 8px; position: absolute; top: 24px; right: 24px; `;
const Name = styled.div` font-weight: 600; font-size: 16px; margin-bottom: 8px; `;
const Phone = styled.div` font-size: 14px; color: #666; margin-bottom: 8px; `;
const Address = styled.div` font-size: 14px; color: #333; margin-bottom: 20px; line-height: 1.5; `;
const ButtonGroup = styled.div` display: flex; gap: 10px; `;
const Button = styled.button` background: #fff; border: 1px solid #ddd; padding: 8px 16px; font-size: 12px; cursor: pointer; &:hover { border-color: #333; } `;
const AddButton = styled.button` width: 100%; padding: 16px; border: 1px dashed #aaa; background: none; color: #666; cursor: pointer; &:hover { background: #f9f9f9; color: #333; border-color: #333; } `;