//회원 목록 & 검색// src/pages/admin/UserManagement.tsx
import React, { useState } from 'react';
import styled from 'styled-components';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  status: '정상' | '정지';
}

const UserManagement: React.FC = () => {
  // 가짜 회원 데이터
  const [users] = useState<User[]>([
    { id: 'atto_01', name: '김아토', email: 'kim@atto.com', phone: '010-1111-2222', joinDate: '2024-02-10', status: '정상' },
    { id: 'user_99', name: '이수아', email: 'lee@example.com', phone: '010-3333-4444', joinDate: '2024-01-15', status: '정상' },
    { id: 'black_list', name: '박진상', email: 'bad@bad.com', phone: '010-0000-0000', joinDate: '2023-12-20', status: '정지' },
  ]);

  return (
    <Container>
      <Header>
        <Title>사용자 관리</Title>
        <SearchBox>
          <input type="text" placeholder="회원 아이디 또는 이름 검색" />
          <button>검색</button>
        </SearchBox>
      </Header>

      <TableContainer>
        <UserTable>
          <thead>
            <tr>
              <th>ID</th>
              <th>이름</th>
              <th>Email</th>
              <th>연락처</th>
              <th>가입일</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.phone}</td>
                <td>{user.joinDate}</td>
                <td>
                  <StatusTag active={user.status === '정상'}>{user.status}</StatusTag>
                </td>
                <td>
                  <ActionBtn>상세</ActionBtn>
                  <ActionBtn color="#e74c3c">정지</ActionBtn>
                </td>
              </tr>
            ))}
          </tbody>
        </UserTable>
      </TableContainer>
    </Container>
  );
};

export default UserManagement;

// ---------- Styled Components ----------

const Container = styled.div`
  background: #fff;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Title = styled.h2`
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 500;
  font-size: 24px;
`;

const SearchBox = styled.div`
  display: flex;
  gap: 10px;
  input {
    padding: 10px 15px; border: 1px solid #ddd; border-radius: 4px; width: 250px;
  }
  button {
    padding: 10px 20px; background: #1a1a1a; color: #fff; border: none; border-radius: 4px; cursor: pointer;
  }
`;

const TableContainer = styled.div`
  overflow-x: auto;
`;

const UserTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  th, td {
    padding: 18px 15px;
    text-align: left;
    font-size: 14px;
    border-bottom: 1px solid #eee;
  }
  th {
    background-color: #f9f9f9;
    font-weight: 600;
    color: #555;
  }
`;

const StatusTag = styled.span<{ active: boolean }>`
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  background-color: ${props => props.active ? '#e6f4ea' : '#fce8e6'};
  color: ${props => props.active ? '#1e7e34' : '#d93025'};
`;

const ActionBtn = styled.button<{ color?: string }>`
  background: none;
  border: none;
  color: ${props => props.color || '#3498db'};
  cursor: pointer;
  margin-right: 15px;
  font-size: 13px;
  text-decoration: underline;
  &:hover { opacity: 0.7; }
`;
