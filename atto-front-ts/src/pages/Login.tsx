// src/pages/Login.tsx
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';

declare global {
  interface Window {
    Kakao?: {
      init: (appKey: string) => void;
      isInitialized: () => boolean;
      Auth: {
        loginWithKakaoAccount?: (options: {
          success: (authObj: unknown) => void;
          fail: (error: unknown) => void;
        }) => void;
        login: (options: {
          scope?: string;
          success: (authObj: unknown) => void;
          fail: (error: unknown) => void;
        }) => void;
      };
      API: {
        request: (options: {
          url: string;
          success: (response: unknown) => void;
          fail: (error: unknown) => void;
        }) => void;
      };
    };
  }
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [kakaoReady, setKakaoReady] = useState(false);
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

  const loadKakaoSdk = () =>
    new Promise<void>((resolve, reject) => {
      if (window.Kakao) {
        resolve();
        return;
      }

      const existingScript = document.getElementById('kakao-js-sdk') as HTMLScriptElement | null;
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject(new Error('카카오 SDK 로드 실패')));
        return;
      }

      const script = document.createElement('script');
      script.id = 'kakao-js-sdk';
      script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('카카오 SDK 로드 실패'));
      document.head.appendChild(script);
    });

  useEffect(() => {
    const kakaoKey = import.meta.env.VITE_KAKAO_JS_KEY as string | undefined;
    if (!kakaoKey) return;

    loadKakaoSdk()
      .then(() => {
        if (!window.Kakao) return;
        if (!window.Kakao.isInitialized()) {
          window.Kakao.init(kakaoKey);
        }
        setKakaoReady(true);
      })
      .catch(() => {
        setKakaoReady(false);
      });
  }, []);

  const handleKakaoLogin = () => {
    if (!kakaoReady || !window.Kakao) {
      alert('카카오 로그인 준비 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    const onLoginSuccess = () => {
      window.Kakao?.API.request({
        url: '/v2/user/me',
        success: (response) => {
          const user = response as {
            id?: number;
            kakao_account?: { email?: string; profile?: { nickname?: string } };
          };

          const kakaoEmail = user.kakao_account?.email || `kakao_${user.id ?? 'user'}@kakao.local`;
          localStorage.setItem(
            'atto_auth',
            JSON.stringify({
              email: kakaoEmail,
              role: 'user',
              provider: 'kakao',
              nickname: user.kakao_account?.profile?.nickname ?? '',
            }),
          );
          window.dispatchEvent(new Event('auth-changed'));
          alert('카카오 로그인에 성공했습니다.');
          navigate('/');
        },
        fail: () => {
          alert('카카오 사용자 정보를 불러오지 못했습니다.');
        },
      });
    };

    const onLoginFail = () => {
      alert('카카오 로그인이 취소되었거나 실패했습니다.');
    };

    if (typeof window.Kakao.Auth.loginWithKakaoAccount === 'function') {
      window.Kakao.Auth.loginWithKakaoAccount({
        success: onLoginSuccess,
        fail: onLoginFail,
      });
      return;
    }

    if (typeof window.Kakao.Auth.login === 'function') {
      window.Kakao.Auth.login({
        success: onLoginSuccess,
        fail: onLoginFail,
      });
      return;
    }

    alert('카카오 로그인 API를 사용할 수 없습니다. SDK 버전을 확인해주세요.');
  };

  const handleKakaoButtonClick = () => {
    const kakaoKey = import.meta.env.VITE_KAKAO_JS_KEY as string | undefined;
    if (!kakaoKey) {
      alert('카카오 로그인 키가 없습니다. .env에 VITE_KAKAO_JS_KEY를 설정해주세요.');
      return;
    }
    handleKakaoLogin();
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
        <KakaoButton type="button" onClick={handleKakaoButtonClick} disabled={!kakaoReady}>
          카카오로 로그인
        </KakaoButton>

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

const KakaoButton = styled.button`
  width: 100%;
  padding: 16px;
  background: #fee500;
  color: #191600;
  border: 1px solid #f5d900;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.3px;
  cursor: pointer;
  margin-top: 10px;

  &:hover {
    background: #f8df00;
  }

  &:disabled {
    opacity: 0.7;
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
