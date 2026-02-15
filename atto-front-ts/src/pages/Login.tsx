// src/pages/Login.tsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const ADMIN_IDS = new Set(['admin', 'admin@atto.com', 'soo1234']);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 나중에 백엔드 API와 연결할 부분
    console.log('Login:', email, password);

    const normalizedId = email.trim().toLowerCase();
    const isAdmin = ADMIN_IDS.has(normalizedId);
    const role = isAdmin ? 'admin' : 'user';
    localStorage.setItem(
      'atto_auth',
      JSON.stringify({
        email,
        role,
      }),
    );
    window.dispatchEvent(new Event('auth-changed'));

    // 임시 로그인 성공 처리
    alert(`환영합니다, ${email}님!`);
    navigate(isAdmin ? '/admin' : '/'); // admin은 관리자 대시보드로 이동
  };

  return (
    <Container>
      <FormWrapper>
        <Title>LOGIN</Title>
        <form onSubmit={handleSubmit}>
          <InputGroup>
            <Label>Email / ID</Label>
            <Input 
              type="text" 
              placeholder="이메일 또는 아이디를 입력해주세요" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
          
          <Button type="submit">SIGN IN</Button>
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
  border-radius: 0; /* 모바일 사파리 기본 스타일 제거 */

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
