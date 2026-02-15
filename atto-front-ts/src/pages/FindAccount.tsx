// src/pages/auth/FindAccount.tsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

type TabType = 'id' | 'password';

const FindAccount: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('id');
  
  // 입력 상태 관리
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState(''); // 비밀번호 찾기용 아이디 입력

  // 아이디 찾기 핸들러
  const handleFindId = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 백엔드 API 연동
    console.log('Find ID:', name, email);
    alert(`고객님의 아이디는 'atto_user' 입니다.`);
  };

  // 비밀번호 찾기 핸들러
  const handleFindPw = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 백엔드 API 연동
    console.log('Find PW:', userId, name, email);
    alert(`입력하신 이메일(${email})로 임시 비밀번호를 발송했습니다.`);
  };

  return (
    <Container>
      <Wrapper>
        <Title>FIND ACCOUNT</Title>
        
        {/* 탭 메뉴 */}
        <TabContainer>
          <Tab 
            isActive={activeTab === 'id'} 
            onClick={() => setActiveTab('id')}
          >
            FIND ID
          </Tab>
          <Tab 
            isActive={activeTab === 'password'} 
            onClick={() => setActiveTab('password')}
          >
            FIND PASSWORD
          </Tab>
        </TabContainer>

        {/* 탭 내용 */}
        <ContentBox>
          {activeTab === 'id' ? (
            // --- 아이디 찾기 폼 ---
            <form onSubmit={handleFindId}>
              <Description>
                가입 시 등록한 이름과 이메일을 입력해주세요.
              </Description>
              <Input 
                type="text" 
                placeholder="Name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input 
                type="email" 
                placeholder="Email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit">FIND ID</Button>
            </form>
          ) : (
            // --- 비밀번호 찾기 폼 ---
            <form onSubmit={handleFindPw}>
              <Description>
                가입한 아이디, 이름, 이메일을 입력해주세요.<br/>
                이메일로 임시 비밀번호가 전송됩니다.
              </Description>
              <Input 
                type="text" 
                placeholder="ID" 
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
              />
              <Input 
                type="text" 
                placeholder="Name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input 
                type="email" 
                placeholder="Email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit">RESET PASSWORD</Button>
            </form>
          )}
        </ContentBox>

        <BackLink>
          <Link to="/login">Back to Login</Link>
        </BackLink>

      </Wrapper>
    </Container>
  );
};

export default FindAccount;

// ---------- Styled Components ----------

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100px 20px;
  min-height: 60vh;
`;

const Wrapper = styled.div`
  width: 100%;
  max-width: 400px;
  text-align: center;
`;

const Title = styled.h2`
  font-size: 28px;
  margin-bottom: 40px;
  font-family: 'Playfair Display', serif;
  letter-spacing: 2px;
  color: #1a1a1a;
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 40px;
  border-bottom: 1px solid #eee;
`;

const Tab = styled.button<{ isActive: boolean }>`
  flex: 1;
  padding: 15px 0;
  background: none;
  border: none;
  border-bottom: 2px solid ${props => props.isActive ? '#1a1a1a' : 'transparent'};
  color: ${props => props.isActive ? '#1a1a1a' : '#aaa'};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    color: #1a1a1a;
  }
`;

const ContentBox = styled.div`
  animation: fadeIn 0.3s ease-in-out;
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const Description = styled.p`
  font-size: 13px;
  color: #666;
  margin-bottom: 24px;
  line-height: 1.5;
`;

const Input = styled.input`
  width: 100%;
  padding: 14px 0;
  margin-bottom: 20px;
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
  font-weight: 600;
  letter-spacing: 1px;
  cursor: pointer;
  margin-top: 10px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #444;
  }
`;

const BackLink = styled.div`
  margin-top: 30px;
  
  a {
    font-size: 13px;
    color: #888;
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: all 0.2s;

    &:hover {
      color: #333;
      border-bottom-color: #333;
    }
  }
`;