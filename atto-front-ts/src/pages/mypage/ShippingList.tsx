import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { API_BASE_URL } from '../../config/api';
import { authFetch } from '../../utils/authFetch';
import { showConfirm } from '../../components/common/appDialog';

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
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<AddressItem | null>(null);
  const [form, setForm] = useState({
    recipientName: '',
    phone: '',
    zipcode: '',
    address1: '',
    address2: '',
    isDefault: false,
  });
  const [saving, setSaving] = useState(false);
  const [postcodeReady, setPostcodeReady] = useState(false);

  const fetchAddresses = useCallback(async () => {
    if (!user?.userId) {
      setLoading(false);
      return;
    }

    try {
      const response = await authFetch(`${API_BASE_URL}/api/users/${user.userId}/addresses`);
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
  }, [user?.userId]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // 카카오(다음) 우편번호 스크립트 로드
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).daum?.Postcode) {
      setPostcodeReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    script.onload = () => setPostcodeReady(true);
    script.onerror = () => setPostcodeReady(false);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const openCreate = () => {
    setForm({
      recipientName: '',
      phone: '',
      zipcode: '',
      address1: '',
      address2: '',
      isDefault: addresses.length === 0,
    });
    setSelectedAddress(null);
    setModalMode('create');
  };

  const openEdit = (address: AddressItem) => {
    setForm({
      recipientName: address.recipientName,
      phone: address.phone,
      zipcode: address.zipcode,
      address1: address.address1,
      address2: address.address2,
      isDefault: Number(address.isDefault) === 1,
    });
    setSelectedAddress(address);
    setModalMode('edit');
  };

  const closeModal = () => {
    if (saving) return;
    setModalMode(null);
    setSelectedAddress(null);
  };

  const handleChange = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!user?.userId) return;
    if (!form.recipientName || !form.phone || !form.zipcode || !form.address1) {
      alert('받는 분, 연락처, 우편번호, 주소1은 필수입니다.');
      return;
    }

    setSaving(true);

    try {
      const payload = { ...form };
      const url = modalMode === 'edit'
        ? `${API_BASE_URL}/api/users/${user.userId}/addresses/${selectedAddress?.addressId}`
        : `${API_BASE_URL}/api/users/${user.userId}/addresses`;
      const method = modalMode === 'edit' ? 'PUT' : 'POST';

      const response = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        alert(result.message ?? '저장에 실패했습니다.');
        return;
      }

      await fetchAddresses();
      closeModal();
    } catch (error) {
      alert('서버 연결에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (addressId: number) => {
    if (!user?.userId) return;
    const confirmed = await showConfirm('이 배송지를 삭제할까요?');
    if (!confirmed) return;
    try {
      const response = await authFetch(`${API_BASE_URL}/api/users/${user.userId}/addresses/${addressId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        alert(result.message ?? '삭제에 실패했습니다.');
        return;
      }
      await fetchAddresses();
    } catch {
      alert('서버 연결에 실패했습니다.');
    }
  };

  const handleSetDefault = async (addressId: number) => {
    if (!user?.userId) return;
    try {
      const response = await authFetch(`${API_BASE_URL}/api/users/${user.userId}/addresses/${addressId}/default`, {
        method: 'PATCH',
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        alert(result.message ?? '기본 배송지 설정에 실패했습니다.');
        return;
      }
      await fetchAddresses();
    } catch {
      alert('서버 연결에 실패했습니다.');
    }
  };

  const openPostcode = () => {
    if (!(window as any).daum?.Postcode) {
      alert('우편번호 서비스를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    new (window as any).daum.Postcode({
      oncomplete: (data: any) => {
        handleChange('zipcode', data.zonecode || '');
        handleChange('address1', data.roadAddress || data.jibunAddress || '');
      },
    }).open();
  };

  if (!user?.userId) {
    return <Container>로그인 후 이용해주세요.</Container>;
  }

  return (
    <Container>
      <Title>배송지 관리</Title>

      {loading ? (
        <EmptyText>불러오는 중...</EmptyText>
      ) : addresses.length === 0 ? (
        <EmptyText>등록된 배송지가 없습니다.</EmptyText>
      ) : (
        addresses.map((address) => (
          <AddressCard key={address.addressId}>
            <CardHeader>
              <div>
                <Name>{address.recipientName}</Name>
                <Phone>{address.phone}</Phone>
              </div>
              {Number(address.isDefault) === 1 && <Badge>기본 배송지</Badge>}
            </CardHeader>

            <Address>
              ({address.zipcode}) {address.address1} {address.address2}
            </Address>

            <ButtonGroup>
              <Button type="button" onClick={() => openEdit(address)}>수정</Button>
              <Button type="button" onClick={() => handleDelete(address.addressId)}>삭제</Button>
              {Number(address.isDefault) !== 1 && (
                <Button type="button" onClick={() => handleSetDefault(address.addressId)}>기본 배송지로</Button>
              )}
            </ButtonGroup>
          </AddressCard>
        ))
      )}

      <AddButton type="button" onClick={openCreate}>
        + 새 배송지 추가
      </AddButton>

      {modalMode && (
        <Dimmer>
          <Modal>
            <ModalHeader>{modalMode === 'create' ? '새 배송지 추가' : '배송지 수정'}</ModalHeader>
            <ModalBody>
              <Label>
                받는 분
                <Input
                  value={form.recipientName}
                  onChange={(e) => handleChange('recipientName', e.target.value)}
                  placeholder="홍길동"
                />
              </Label>
              <Label>
                연락처
                <Input
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="01012345678"
                />
              </Label>
              <Label>
                우편번호
                <Row>
                  <Input
                    value={form.zipcode}
                    onChange={(e) => handleChange('zipcode', e.target.value)}
                    placeholder="00000"
                    style={{ flex: 1 }}
                  />
                  <SecondaryButton type="button" onClick={openPostcode} disabled={!postcodeReady}>
                    주소 검색
                  </SecondaryButton>
                </Row>
              </Label>
              <Label>
                주소 1
                <Input
                  value={form.address1}
                  onChange={(e) => handleChange('address1', e.target.value)}
                  placeholder="도로명 주소"
                />
              </Label>
              <Label>
                주소 2
                <Input
                  value={form.address2}
                  onChange={(e) => handleChange('address2', e.target.value)}
                  placeholder="동/호수 등 (선택)"
                />
              </Label>
              <CheckboxRow>
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={form.isDefault}
                  onChange={(e) => handleChange('isDefault', e.target.checked)}
                />
                <label htmlFor="isDefault">기본 배송지로 설정</label>
              </CheckboxRow>
            </ModalBody>
            <ModalActions>
              <Button type="button" onClick={closeModal} disabled={saving}>
                취소
              </Button>
              <PrimaryButton type="button" onClick={handleSubmit} disabled={saving}>
                {saving ? '저장 중...' : modalMode === 'create' ? '등록' : '수정 완료'}
              </PrimaryButton>
            </ModalActions>
          </Modal>
        </Dimmer>
      )}
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

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
`;

const Dimmer = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
`;

const Modal = styled.div`
  width: 92%;
  max-width: 420px;
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.h3`
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 700;
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const PrimaryButton = styled(Button)`
  background: #1a1a1a;
  color: #fff;
  border-color: #1a1a1a;

  &:hover {
    background: #000;
    border-color: #000;
  }
`;

const Label = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #444;
`;

const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;

  &:focus {
    outline: none;
    border-color: #1a1a1a;
  }
`;

const CheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #444;
`;

const Row = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const SecondaryButton = styled(Button)`
  padding: 10px 12px;
  white-space: nowrap;
`;
