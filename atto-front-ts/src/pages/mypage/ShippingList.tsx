import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { API_BASE_URL } from '../../config/api';

type StoredUser = {
  userId: number;
};

type AddressItem = {
  addressId: number;
  recipientName: string;
  phone: string;
  zipcode: string;
  address1: string;
  address2: string;
  isDefault: number;
};

const ShippingList: React.FC = () => {
  const user = useMemo<StoredUser | null>(() => {
    try {
      const raw = localStorage.getItem('attoUser');
      if (!raw) return null;
      return JSON.parse(raw) as StoredUser;
    } catch {
      return null;
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user?.userId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/users/${user.userId}/addresses`);
        const result = await response.json();

        if (!response.ok || !result.ok) {
          alert(result.message ?? '배송지 목록을 불러오지 못했습니다.');
          return;
        }

        setAddresses(Array.isArray(result.addresses) ? result.addresses : []);
      } catch {
        alert('서버 연결에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [user?.userId]);

  const handleDisabledAction = () => {
    alert('배송지 추가/수정 UI는 곧 적용 예정입니다.');
  };

  if (!user?.userId) {
    return <Container>로그인 후 이용해주세요.</Container>;
  }

  return (
    <Container>
      <Title>Shipping Address</Title>

      {loading ? (
        <EmptyText>불러오는 중...</EmptyText>
      ) : addresses.length === 0 ? (
        <EmptyText>등록된 배송지가 없습니다.</EmptyText>
      ) : (
        addresses.map((address) => (
          <AddressCard key={address.addressId}>
            {Number(address.isDefault) === 1 && <Badge>기본 배송지</Badge>}
            <Name>{address.recipientName}</Name>
            <Phone>{address.phone}</Phone>
            <Address>
              ({address.zipcode}) {address.address1} {address.address2}
            </Address>
            <ButtonGroup>
              <Button type="button" onClick={handleDisabledAction}>
                수정
              </Button>
            </ButtonGroup>
          </AddressCard>
        ))
      )}

      <AddButton type="button" onClick={handleDisabledAction}>
        + 새 배송지 추가
      </AddButton>
    </Container>
  );
};

export default ShippingList;

const Container = styled.div`
  width: 100%;
  max-width: 600px;
`;

const Title = styled.h2`
  font-size: 24px;
  font-family: 'Playfair Display', serif;
  margin-bottom: 30px;
  border-bottom: 1px solid #ddd;
  padding-bottom: 15px;
`;

const AddressCard = styled.div`
  border: 1px solid #ddd;
  padding: 24px;
  margin-bottom: 20px;
  position: relative;
`;

const Badge = styled.span`
  background: #eee;
  font-size: 11px;
  padding: 4px 8px;
  position: absolute;
  top: 24px;
  right: 24px;
`;

const Name = styled.div`
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 8px;
`;

const Phone = styled.div`
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
`;

const Address = styled.div`
  font-size: 14px;
  color: #333;
  margin-bottom: 20px;
  line-height: 1.5;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const Button = styled.button`
  background: #fff;
  border: 1px solid #ddd;
  padding: 8px 16px;
  font-size: 12px;
  cursor: pointer;

  &:hover {
    border-color: #333;
  }
`;

const AddButton = styled.button`
  width: 100%;
  padding: 16px;
  border: 1px dashed #aaa;
  background: none;
  color: #666;
  cursor: pointer;

  &:hover {
    background: #f9f9f9;
    color: #333;
    border-color: #333;
  }
`;

const EmptyText = styled.p`
  font-size: 14px;
  color: #777;
  padding: 20px 0;
`;
