import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { API_BASE_URL } from '../../config/api';

type StoredUser = {
  userId: number;
  id: string;
  email: string;
  name: string;
};

type ProfileResponse = {
  ok: boolean;
  user?: {
    userId: number;
    id: string;
    name: string;
    phone: string;
    mail: string;
  };
  address?: {
    recipientName: string;
    zipcode: string;
    address1: string;
    address2: string;
  } | null;
  message?: string;
};

const EditProfile: React.FC = () => {
  const storedUser = useMemo<StoredUser | null>(() => {
    try {
      const raw = localStorage.getItem('attoUser');
      if (!raw) return null;
      return JSON.parse(raw) as StoredUser;
    } catch {
      return null;
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    mail: '',
    name: '',
    phone: '',
    recipientName: '',
    zipcode: '',
    address1: '',
    address2: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!storedUser?.userId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/users/${storedUser.userId}/profile`);
        const result: ProfileResponse = await response.json();

        if (!response.ok || !result.ok || !result.user) {
          alert(result.message ?? '회원정보를 불러오지 못했습니다.');
          return;
        }

        setFormData((prev) => ({
          ...prev,
          id: result.user!.id,
          mail: result.user!.mail,
          name: result.user!.name,
          phone: result.user!.phone,
          recipientName: result.address?.recipientName ?? result.user!.name,
          zipcode: result.address?.zipcode ?? '',
          address1: result.address?.address1 ?? '',
          address2: result.address?.address2 ?? '',
        }));
      } catch {
        alert('서버 연결에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [storedUser?.userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!storedUser?.userId) {
      alert('로그인 정보가 없습니다. 다시 로그인해주세요.');
      return;
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      alert('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${storedUser.userId}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          recipientName: formData.recipientName,
          zipcode: formData.zipcode,
          address1: formData.address1,
          address2: formData.address2,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        alert(result.message ?? '회원정보 수정에 실패했습니다.');
        return;
      }

      localStorage.setItem(
        'attoUser',
        JSON.stringify({
          ...storedUser,
          name: formData.name,
        })
      );

      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));

      alert('회원정보가 수정되었습니다.');
    } catch {
      alert('서버 연결에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Container>불러오는 중...</Container>;
  }

  if (!storedUser?.userId) {
    return <Container>로그인 후 이용해주세요.</Container>;
  }

  return (
    <Container>
      <Title>Edit Profile</Title>
      <Form onSubmit={handleSubmit}>
        <InputGroup>
          <Label>ID</Label>
          <Input name="id" value={formData.id} disabled />
        </InputGroup>
        <InputGroup>
          <Label>Email</Label>
          <Input name="mail" value={formData.mail} disabled />
        </InputGroup>
        <InputGroup>
          <Label>Name</Label>
          <Input name="name" value={formData.name} onChange={handleChange} required />
        </InputGroup>
        <InputGroup>
          <Label>Phone</Label>
          <Input name="phone" value={formData.phone} onChange={handleChange} required />
        </InputGroup>

        <InputGroup>
          <Label>Recipient Name</Label>
          <Input name="recipientName" value={formData.recipientName} onChange={handleChange} />
        </InputGroup>
        <InputGroup>
          <Label>Zipcode</Label>
          <Input name="zipcode" value={formData.zipcode} onChange={handleChange} />
        </InputGroup>
        <InputGroup>
          <Label>Address</Label>
          <Input name="address1" value={formData.address1} onChange={handleChange} />
          <Input name="address2" value={formData.address2} onChange={handleChange} style={{ marginTop: '10px' }} />
        </InputGroup>

        <InputGroup>
          <Label>Current Password</Label>
          <Input type="password" name="currentPassword" value={formData.currentPassword} onChange={handleChange} />
        </InputGroup>
        <InputGroup>
          <Label>New Password</Label>
          <Input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} />
          <Input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="새 비밀번호 확인"
            style={{ marginTop: '10px' }}
          />
        </InputGroup>

        <SaveButton type="submit" disabled={saving}>
          {saving ? 'SAVING...' : 'SAVE CHANGES'}
        </SaveButton>
      </Form>
    </Container>
  );
};

export default EditProfile;

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

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 13px;
  color: #666;
  font-weight: 600;
  text-transform: uppercase;
`;

const Input = styled.input`
  padding: 12px;
  border: 1px solid #ddd;
  font-size: 14px;

  &:focus {
    border-color: #333;
    outline: none;
  }

  &:disabled {
    background: #f9f9f9;
    color: #999;
  }
`;

const SaveButton = styled.button`
  background: #1a1a1a;
  color: #fff;
  padding: 16px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  margin-top: 20px;

  &:hover {
    background: #333;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
