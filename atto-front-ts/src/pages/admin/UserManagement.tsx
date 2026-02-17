import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

type AdminUser = {
  userId: number;
  id: string;
  name: string;
  phone: string | null;
  mail: string;
  role: 'ADMIN' | 'USER';
  created_at: string;
  updated_at: string;
};

const API_BASE = 'http://127.0.0.1:4000';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [workingUserId, setWorkingUserId] = useState<number | null>(null);

  const loadUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/users`);
      const result = await response.json();
      if (!response.ok || !result.ok) {
        alert(result.message ?? '사용자 목록 조회 실패');
        return;
      }
      setUsers(Array.isArray(result.users) ? (result.users as AdminUser[]) : []);
    } catch {
      alert('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return users;
    return users.filter(
      (user) =>
        String(user.id).toLowerCase().includes(keyword) ||
        String(user.name).toLowerCase().includes(keyword) ||
        String(user.mail).toLowerCase().includes(keyword)
    );
  }, [query, users]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '-';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const roleLabel = (role: AdminUser['role']) => (role === 'ADMIN' ? '관리자' : '일반회원');

  const toggleRole = async (user: AdminUser) => {
    const nextRole: AdminUser['role'] = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    setWorkingUserId(user.userId);
    try {
      const response = await fetch(`${API_BASE}/api/admin/users/${user.userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        alert(result.message ?? '권한 변경 실패');
        return;
      }
      setUsers((prev) => prev.map((u) => (u.userId === user.userId ? { ...u, role: nextRole } : u)));
      setSelectedUser((prev) => (prev && prev.userId === user.userId ? { ...prev, role: nextRole } : prev));
    } catch {
      alert('서버 연결에 실패했습니다.');
    } finally {
      setWorkingUserId(null);
    }
  };

  return (
    <Container>
      <Header>
        <Title>사용자 관리</Title>
        <SearchBox>
          <input type="text" placeholder="아이디 / 이름 / 이메일 검색" value={query} onChange={(e) => setQuery(e.target.value)} />
        </SearchBox>
      </Header>

      <TableContainer>
        <UserTable>
          <thead>
            <tr>
              <th>USER ID</th>
              <th>아이디</th>
              <th>이름</th>
              <th>Email</th>
              <th>연락처</th>
              <th>가입일</th>
              <th>권한</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8}>불러오는 중...</td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={8}>검색 결과가 없습니다.</td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.userId}>
                  <td>{user.userId}</td>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.mail}</td>
                  <td>{user.phone ?? '-'}</td>
                  <td>{formatDate(user.created_at)}</td>
                  <td>
                    <RoleTag $active={user.role === 'ADMIN'}>{roleLabel(user.role)}</RoleTag>
                  </td>
                  <td>
                    <ActionBtn type="button" onClick={() => setSelectedUser(user)}>
                      상세
                    </ActionBtn>
                    <ActionBtn type="button" onClick={() => toggleRole(user)} disabled={workingUserId === user.userId}>
                      {user.role === 'ADMIN' ? '관리자 해제' : '관리자 지정'}
                    </ActionBtn>
                  </td>
                </tr>
              ))
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
              <button type="button" onClick={() => setSelectedUser(null)}>x</button>
            </ModalHead>
            <DetailGrid>
              <span>USER ID</span><strong>{selectedUser.userId}</strong>
              <span>아이디</span><strong>{selectedUser.id}</strong>
              <span>이름</span><strong>{selectedUser.name}</strong>
              <span>이메일</span><strong>{selectedUser.mail}</strong>
              <span>연락처</span><strong>{selectedUser.phone ?? '-'}</strong>
              <span>가입일</span><strong>{formatDate(selectedUser.created_at)}</strong>
              <span>권한</span><strong>{roleLabel(selectedUser.role)}</strong>
            </DetailGrid>
            <ModalFooter>
              <ActionBtn type="button" onClick={() => toggleRole(selectedUser)} disabled={workingUserId === selectedUser.userId}>
                {selectedUser.role === 'ADMIN' ? '관리자 해제' : '관리자 지정'}
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

const Container = styled.div`
  background: #f7f5f0;
  margin: -40px;
  padding: 24px;
  min-height: calc(100vh - 80px);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
`;

const Title = styled.h2`
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 500;
  font-size: 21px;
`;

const SearchBox = styled.div`
  display: flex;
  gap: 10px;
  input {
    padding: 10px 15px;
    border: 1px solid #d9d9d9;
    width: 280px;
    background: #fff;
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

  th,
  td {
    padding: 16px 12px;
    border-bottom: 1px solid #ece7de;
    text-align: left;
    font-size: 13px;
    white-space: nowrap;
  }

  th {
    background: #fcfbf8;
    color: #6f6f6f;
    font-weight: 600;
  }
`;

const RoleTag = styled.span<{ $active: boolean }>`
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 999px;
  background-color: ${(props) => (props.$active ? '#f5f7f3' : '#f4f4f4')};
`;

const ActionBtn = styled.button`
  background: #fff;
  border: 1px solid #d9d9d9;
  margin-right: 8px;
  padding: 6px 10px;
  cursor: pointer;
`;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 20;
`;

const UserDetailModal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(520px, calc(100vw - 24px));
  background: #fff;
  border: 1px solid #ddd;
  z-index: 21;
  padding: 18px;
`;

const ModalHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;

  button {
    border: none;
    background: transparent;
    cursor: pointer;
  }
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 8px 10px;
  padding: 14px;
  border: 1px solid #ece7de;
  background: #fcfbf8;

  span {
    color: #666;
  }
`;

const ModalFooter = styled.div`
  margin-top: 14px;
`;
