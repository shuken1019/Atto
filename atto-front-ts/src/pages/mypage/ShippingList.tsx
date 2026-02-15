import React, { useState } from 'react';
import styled from 'styled-components';

type ShippingAddress = {
  id: number;
  label: string;
  name: string;
  phone: string;
  address: string;
  isDefault: boolean;
};

const ShippingList: React.FC = () => {
  const [addresses, setAddresses] = useState<ShippingAddress[]>([
    {
      id: 1,
      label: '집',
      name: '김아토',
      phone: '010-1234-5678',
      address: '서울특별시 강남구 테헤란로 123, 아토빌딩 101호',
      isDefault: true,
    },
  ]);

  const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ShippingAddress | null>(null);
  const [form, setForm] = useState({ label: '', name: '', phone: '', address: '' });

  const openEditModal = (target: ShippingAddress) => {
    setEditingAddress(target);
    setForm({
      label: target.label,
      name: target.name,
      phone: target.phone,
      address: target.address,
    });
  };

  const closeEditModal = () => {
    setEditingAddress(null);
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
  };

  const handleSaveEdit = () => {
    if (!editingAddress) return;
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      alert('받는 분, 연락처, 주소를 입력해주세요.');
      return;
    }

    setAddresses((prev) =>
      prev.map((item) =>
        item.id === editingAddress.id
          ? { ...item, label: form.label.trim() || '기타', name: form.name.trim(), phone: form.phone.trim(), address: form.address.trim() }
          : item,
      ),
    );
    closeEditModal();
  };

  const handleDeleteAddress = () => {
    if (!deleteTarget) return;
    setAddresses((prev) => prev.filter((item) => item.id !== deleteTarget.id));
    closeDeleteModal();
  };

  return (
    <Container>
      <Title>Shipping Address</Title>
      {addresses.length > 0 ? (
        addresses.map((item) => (
          <AddressCard key={item.id}>
            {item.isDefault && <Badge>기본 배송지</Badge>}
            <Name>{item.name}</Name>
            <Phone>{item.phone}</Phone>
            <Label>{item.label}</Label>
            <Address>{item.address}</Address>
            <ButtonGroup>
              <Button type="button" onClick={() => openEditModal(item)}>
                수정
              </Button>
              <DangerButton type="button" onClick={() => setDeleteTarget(item)}>
                삭제
              </DangerButton>
            </ButtonGroup>
          </AddressCard>
        ))
      ) : (
        <EmptyText>저장된 배송지가 없습니다.</EmptyText>
      )}
      
      <AddButton>+ 새 배송지 추가</AddButton>

      {editingAddress && (
        <ModalOverlay onClick={closeEditModal}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalTitle>배송지 수정</ModalTitle>
            <FieldGroup>
              <FieldLabel>배송지 이름</FieldLabel>
              <Input
                value={form.label}
                onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
                placeholder="예: 집, 회사"
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>받는 분</FieldLabel>
              <Input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>연락처</FieldLabel>
              <Input
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>주소</FieldLabel>
              <Input
                value={form.address}
                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              />
            </FieldGroup>
            <ModalActions>
              <SecondaryButton type="button" onClick={closeEditModal}>
                취소
              </SecondaryButton>
              <PrimaryButton type="button" onClick={handleSaveEdit}>
                저장
              </PrimaryButton>
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      )}

      {deleteTarget && (
        <ModalOverlay onClick={closeDeleteModal}>
          <ConfirmCard onClick={(e) => e.stopPropagation()}>
            <ModalTitle>배송지 삭제</ModalTitle>
            <ConfirmText>
              <strong>{deleteTarget.label}</strong> 배송지를 삭제하시겠습니까?
            </ConfirmText>
            <ModalActions>
              <SecondaryButton type="button" onClick={closeDeleteModal}>
                취소
              </SecondaryButton>
              <DangerActionButton type="button" onClick={handleDeleteAddress}>
                삭제
              </DangerActionButton>
            </ModalActions>
          </ConfirmCard>
        </ModalOverlay>
      )}
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
const Label = styled.div` font-size: 12px; color: #999; margin-bottom: 6px; `;
const Address = styled.div` font-size: 14px; color: #333; margin-bottom: 20px; line-height: 1.5; `;
const ButtonGroup = styled.div` display: flex; gap: 10px; `;
const Button = styled.button` background: #fff; border: 1px solid #ddd; padding: 8px 16px; font-size: 12px; cursor: pointer; &:hover { border-color: #333; } `;
const DangerButton = styled(Button)` color: #c44c4c; border-color: #efc9c9; &:hover { border-color: #d95f5f; } `;
const AddButton = styled.button` width: 100%; padding: 16px; border: 1px dashed #aaa; background: none; color: #666; cursor: pointer; &:hover { background: #f9f9f9; color: #333; border-color: #333; } `;
const EmptyText = styled.p` color: #888; font-size: 14px; margin-bottom: 16px; `;
const ModalOverlay = styled.div` position: fixed; inset: 0; background: rgba(0, 0, 0, 0.45); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 300; `;
const ModalCard = styled.div` width: 100%; max-width: 480px; background: #fff; padding: 24px; border-radius: 10px; `;
const ConfirmCard = styled(ModalCard)` max-width: 420px; `;
const ModalTitle = styled.h3` font-size: 20px; margin-bottom: 18px; font-family: 'Playfair Display', serif; `;
const FieldGroup = styled.div` display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; `;
const FieldLabel = styled.label` font-size: 12px; color: #666; font-weight: 600; `;
const Input = styled.input` border: 1px solid #ddd; padding: 10px 12px; font-size: 14px; &:focus { outline: none; border-color: #333; } `;
const ModalActions = styled.div` margin-top: 20px; display: flex; justify-content: flex-end; gap: 8px; `;
const SecondaryButton = styled.button` border: 1px solid #ddd; background: #fff; color: #444; padding: 9px 14px; font-size: 13px; cursor: pointer; `;
const PrimaryButton = styled.button` border: 1px solid #1a1a1a; background: #1a1a1a; color: #fff; padding: 9px 14px; font-size: 13px; cursor: pointer; `;
const DangerActionButton = styled(PrimaryButton)` border-color: #c44c4c; background: #c44c4c; `;
const ConfirmText = styled.p` font-size: 14px; color: #444; line-height: 1.5; `;
