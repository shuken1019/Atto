import React, { useState } from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
    phone: '',
    email: '',
    zipcode: '',
    address: '',
    detailAddress: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:4000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: formData.username,
          name: formData.name,
          phone: formData.phone,
          mail: formData.email,
          password: formData.password,
          recipientName: formData.name,
          zipcode: formData.zipcode,
          address1: formData.address,
          address2: formData.detailAddress,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        alert(result.message ?? '회원가입에 실패했습니다.');
        return;
      }

      alert(`${formData.name}님 회원가입이 완료되었습니다.`);
      navigate('/login');
    } catch {
      alert('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <FormWrapper>
        <Title>CREATE ACCOUNT</Title>
        <form onSubmit={handleSubmit}>
          <InputGroup>
            <Label>Name</Label>
            <Input
              type="text"
              name="name"
              placeholder="이름을 입력해주세요"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </InputGroup>

          <InputGroup>
            <Label>ID</Label>
            <Input
              type="text"
              name="username"
              placeholder="아이디를 입력해주세요"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </InputGroup>

          <InputGroup>
            <Label>Password</Label>
            <Input
              type="password"
              name="password"
              placeholder="비밀번호를 입력해주세요"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <Input
              type="password"
              name="confirmPassword"
              placeholder="비밀번호 확인"
              value={formData.confirmPassword}
              onChange={handleChange}
              style={{ marginTop: '10px' }}
              required
            />
          </InputGroup>

          <InputGroup>
            <Label>Phone</Label>
            <Input
              type="tel"
              name="phone"
              placeholder="010-0000-0000"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </InputGroup>

          <InputGroup>
            <Label>Email</Label>
            <Input
              type="email"
              name="email"
              placeholder="example@atto.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </InputGroup>

          <InputGroup>
            <Label>Shipping Address</Label>
            <Input
              type="text"
              name="zipcode"
              placeholder="우편번호"
              value={formData.zipcode}
              onChange={handleChange}
              required
            />
            <Input
              type="text"
              name="address"
              placeholder="기본 주소를 입력해주세요"
              value={formData.address}
              onChange={handleChange}
              style={{ marginTop: '10px' }}
              required
            />
            <Input
              type="text"
              name="detailAddress"
              placeholder="상세 주소"
              value={formData.detailAddress}
              onChange={handleChange}
              style={{ marginTop: '10px' }}
            />
          </InputGroup>

          <Button type="submit" disabled={loading}>
            {loading ? 'SIGNING UP...' : 'SIGN UP'}
          </Button>
        </form>

        <LoginLink>
          Already have an account? <Link to="/login">Log in</Link>
        </LoginLink>
      </FormWrapper>
    </Container>
  );
};

export default Signup;

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 80px 20px;
  min-height: 80vh;
`;

const FormWrapper = styled.div`
  width: 100%;
  max-width: 420px;
  text-align: center;
`;

const Title = styled.h2`
  font-size: 32px;
  margin-bottom: 50px;
  font-family: 'Playfair Display', serif;
  letter-spacing: 2px;
  color: #1a1a1a;
`;

const InputGroup = styled.div`
  margin-bottom: 28px;
  text-align: left;
`;

const Label = styled.label`
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const Input = styled.input`
  width: 100%;
  padding: 14px 0;
  border: none;
  border-bottom: 1px solid #ddd;
  background: transparent;
  font-size: 15px;
  color: #333;
  outline: none;
  transition: border-color 0.3s;
  border-radius: 0;

  &:focus {
    border-bottom-color: #1a1a1a;
  }

  &::placeholder {
    color: #ccc;
    font-size: 14px;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 18px;
  background-color: #1a1a1a;
  color: #fff;
  border: none;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 1.5px;
  cursor: pointer;
  margin-top: 30px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #444;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LoginLink = styled.div`
  margin-top: 24px;
  font-size: 14px;
  color: #666;

  a {
    color: #1a1a1a;
    font-weight: 600;
    margin-left: 8px;
    border-bottom: 1px solid transparent;
    transition: border-color 0.2s;
    text-decoration: none;

    &:hover {
      border-bottom-color: #1a1a1a;
    }
  }
`;
