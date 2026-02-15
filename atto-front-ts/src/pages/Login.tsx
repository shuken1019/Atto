// src/pages/Login.tsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:4000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ loginId, password }),
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        alert(result.message ?? '로그인에 실패했습니다.');
        return;
      }

      localStorage.setItem('attoUser', JSON.stringify(result.user));
      alert(`${result.user?.name ?? loginId}님 환영합니다.`);
      navigate('/');
    } catch {
      alert('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <FormWrapper>
        <Title>LOGIN</Title>
        <form onSubmit={handleSubmit}>
          <InputGroup>
            <Label>ID</Label>
            <Input
              type="text"
              placeholder="아이디를 입력해주세요"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
            />
          </InputGroup>
          <InputGroup>
            <Label>Password</Label>
            <Input
              type="password"
              placeholder="비밀번호를 입력해주세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </InputGroup>

          <Button type="submit" disabled={loading}>
            {loading ? 'SIGNING IN...' : 'SIGN IN'}
          </Button>
        </form>

        <Links>
          <StyledLink to="/signup">Create Account</StyledLink>
          <StyledLink to="/find-account">Forgot ID/Password?</StyledLink>
        </Links>
      </FormWrapper>
    </Container>
  );
};

export default Login;

// ---------- Styled Components ----------

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100px 20px;
  min-height: 60vh;
`;

const FormWrapper = styled.div`
  width: 100%;
  max-width: 400px;
  text-align: center;
`;

const Title = styled.h2`
  font-size: 32px;
  margin-bottom: 40px;
  font-family: 'Playfair Display', serif;
  letter-spacing: 2px;
  color: #1a1a1a;
`;

const InputGroup = styled.div`
  margin-bottom: 24px;
  text-align: left;
`;

const Label = styled.label`
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 0;
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
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 16px;
  background-color: #1a1a1a;
  color: #fff;
  border: none;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 1px;
  cursor: pointer;
  margin-top: 20px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #333;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Links = styled.div`
  margin-top: 24px;
  display: flex;
  justify-content: space-between;
`;

const StyledLink = styled(Link)`
  font-size: 13px;
  color: #888;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: all 0.2s;

  &:hover {
    color: #333;
    border-bottom-color: #333;
  }
`;
