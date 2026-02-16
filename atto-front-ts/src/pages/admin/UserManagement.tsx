//회원 목록 & 검색// src/pages/admin/UserManagement.tsx
import React, { useMemo, useState } from 'react';
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
  const [users, setUsers] = useState<User[]>([
    { id: 'atto_01', name: '김아토', email: 'kim@atto.com', phone: '010-1111-2222', joinDate: '2024-02-10', status: '정상' },
    { id: 'user_99', name: '이수아', email: 'lee@example.com', phone: '010-3333-4444', joinDate: '2024-01-15', status: '정상' },
    { id: 'black_list', name: '박진상', email: 'bad@bad.com', phone: '010-0000-0000', joinDate: '2023-12-20', status: '정지' },
  ]);
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const filteredUsers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return users;
    return users.filter(
      (user) =>
        user.id.toLowerCase().includes(keyword) ||
        user.name.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword),
    );
  }, [query, users]);

  const toggleStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((user) => {
        if (user.id !== id) return user;
        const nextStatus = user.status === '정상' ? '정지' : '정상';
        return { ...user, status: nextStatus };
      }),
    );
  };

  return (
    <Container>
      <Header>
        <Title>사용자 관리</Title>
        <SearchBox>
          <input
            type="text"
            placeholder="회원 아이디 또는 이름 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="button">검색</button>
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
            {filteredUsers.map((user) => (
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
                  <ActionBtn type="button" onClick={() => setSelectedUser(user)}>상세</ActionBtn>
                  <ActionBtn
                    type="button"
                    color={user.status === '정상' ? '#a35555' : '#4d6b4d'}
                    onClick={() => toggleStatus(user.id)}
                  >
                    {user.status === '정상' ? '정지' : '해제'}
                  </ActionBtn>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={7}>검색 결과가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </UserTable>
      </TableContainer>

      {selectedUser && (
        <>
          <Backdrop onClick={() => setSelectedUser(null)} />
          <UserDetailModal>
            <ModalHead>
              <h3>회원 상세</h3>
              <button type="button" onClick={() => setSelectedUser(null)}>×</button>
            </ModalHead>
            <DetailGrid>
              <span>아이디</span><strong>{selectedUser.id}</strong>
              <span>이름</span><strong>{selectedUser.name}</strong>
              <span>이메일</span><strong>{selectedUser.email}</strong>
              <span>연락처</span><strong>{selectedUser.phone}</strong>
              <span>가입일</span><strong>{selectedUser.joinDate}</strong>
              <span>상태</span><strong>{selectedUser.status}</strong>
            </DetailGrid>
            <ModalFooter>
              <ActionBtn
                type="button"
                color={selectedUser.status === '정상' ? '#a35555' : '#4d6b4d'}
                onClick={() => {
                  toggleStatus(selectedUser.id);
                  setSelectedUser((prev) => (prev ? { ...prev, status: prev.status === '정상' ? '정지' : '정상' } : prev));
                }}
              >
                {selectedUser.status === '정상' ? '정지 처리' : '정상 해제'}
              </ActionBtn>
              <ActionBtn type="button" onClick={() => setSelectedUser(null)}>닫기</ActionBtn>
            </ModalFooter>
          </UserDetailModal>
        </>
      )}
    </Container>
  );
};

export default UserManagement;

// ---------- Styled Components ----------

const Container = styled.div`
  background: #f7f5f0;
  padding: 24px;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 500;
  font-size: 30px;
`;

const SearchBox = styled.div`
  display: flex;
  gap: 10px;
  input {
    padding: 10px 15px; border: 1px solid #d9d9d9; border-radius: 0; width: 250px;
    background: #fff;
  }
  button {
    padding: 10px 20px; background: #333; color: #fff; border: none; border-radius: 0; cursor: pointer;
  }
`;

const TableContainer = styled.div`
  background: #fff;
  border: 1px solid #ece7de;
  padding: 4px 0;
  overflow-x: auto;
`;

const UserTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  th, td {
    padding: 18px 15px;
    text-align: left;
    font-size: 14px;
    border-bottom: 1px solid #ece7de;
  }
  th {
    background-color: #fcfbf8;
    font-weight: 600;
    color: #6f6f6f;
  }
`;

const StatusTag = styled.span<{ active: boolean }>`
  padding: 4px 10px;
  border-radius: 0;
  font-size: 12px;
  background-color: ${props => props.active ? '#f5f7f3' : '#f9f1f1'};
  color: ${props => props.active ? '#4d6b4d' : '#a35555'};
  border: 1px solid ${props => props.active ? '#dce6d6' : '#eed6d6'};
`;

const ActionBtn = styled.button<{ color?: string }>`
  background: #fff;
  border: 1px solid #d9d9d9;
  color: ${props => props.color || '#333'};
  cursor: pointer;
  margin-right: 8px;
  font-size: 13px;
  padding: 6px 10px;
  height: 32px;
  &:hover { opacity: 0.7; }
`;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 50;
`;

const UserDetailModal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(92vw, 520px);
  background: #fff;
  border: 1px solid #ece7de;
  z-index: 60;
  padding: 18px;
`;

const ModalHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;

  h3 {
    font-size: 18px;
    color: #1a1a1a;
    font-weight: 600;
  }

  button {
    border: none;
    background: transparent;
    font-size: 24px;
    color: #666;
    cursor: pointer;
  }
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: 10px 14px;
  padding: 14px;
  border: 1px solid #ece7de;
  background: #fcfbf8;

  span {
    color: #666;
    font-size: 13px;
  }

  strong {
    color: #1a1a1a;
    font-size: 14px;
    font-weight: 500;
    word-break: break-all;
  }
`;

const ModalFooter = styled.div`
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;
