import React, { useState } from 'react';
import styled from 'styled-components';

const EditProfile: React.FC = () => {
  const [name, setName] = useState('김아토');
  const [email, setEmail] = useState('atto@example.com');
  const [phone, setPhone] = useState('010-1234-5678');

  return (
    <Container>
      <Title>Edit Profile</Title>
      <Form>
        <InputGroup>
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </InputGroup>
        <InputGroup>
          <Label>Email</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} disabled />
        </InputGroup>
        <InputGroup>
          <Label>Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </InputGroup>
        <InputGroup>
          <Label>Current Password</Label>
          <Input type="password" placeholder="현재 비밀번호" />
        </InputGroup>
        <InputGroup>
          <Label>New Password</Label>
          <Input type="password" placeholder="변경할 비밀번호" />
        </InputGroup>
        <SaveButton>SAVE CHANGES</SaveButton>
      </Form>
    </Container>
  );
};

export default EditProfile;

const Container = styled.div` width: 100%; max-width: 600px; `;
const Title = styled.h2` font-size: 24px; font-family: 'Playfair Display', serif; margin-bottom: 30px; border-bottom: 1px solid #ddd; padding-bottom: 15px; `;
const Form = styled.div` display: flex; flex-direction: column; gap: 20px; `;
const InputGroup = styled.div` display: flex; flex-direction: column; gap: 8px; `;
const Label = styled.label` font-size: 13px; color: #666; font-weight: 600; text-transform: uppercase; `;
const Input = styled.input` padding: 12px; border: 1px solid #ddd; font-size: 14px; &:focus { border-color: #333; outline: none; } &:disabled { background: #f9f9f9; color: #999; } `;
const SaveButton = styled.button` background: #1a1a1a; color: #fff; padding: 16px; border: none; font-weight: 600; cursor: pointer; margin-top: 20px; &:hover { background: #333; } `;