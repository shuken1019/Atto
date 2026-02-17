import React, { useMemo, useState } from 'react';
import styled from 'styled-components';

type PeriodMode = 'daily' | 'monthly';

const yearOptions = [2026, 2025, 2024];
const monthOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const SalesManagement: React.FC = () => {
  const [periodMode, setPeriodMode] = useState<PeriodMode>('daily');
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(2);

  const todayMetrics = useMemo(
    () => [
      { label: '주문', value: '0 건' },
      { label: '매출액', value: '0 원' },
      { label: '주문당 단가', value: '0 원' },
      { label: '방문자', value: '0 명' },
      { label: '가입자', value: '0 명' },
      { label: '문의', value: '0 건' },
    ],
    [],
  );

  return (
    <Page>
      <HeaderBar>
        <h2>매출</h2>
        <button type="button">참고사항</button>
      </HeaderBar>

      <BodyPanel>
        <Card>
          <CardTop>
            <h3>오늘 매출 현황</h3>
            <RefreshBtn type="button">새로고침</RefreshBtn>
          </CardTop>

          <MetricGrid>
            {todayMetrics.map((metric) => (
              <MetricItem key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </MetricItem>
            ))}
          </MetricGrid>
        </Card>

        <Card>
          <CardTitle>누적 데이터</CardTitle>

          <PeriodRow>
            <ToggleWrap>
              <ToggleBtn type="button" $active={periodMode === 'daily'} onClick={() => setPeriodMode('daily')}>
                일별
              </ToggleBtn>
              <ToggleBtn type="button" $active={periodMode === 'monthly'} onClick={() => setPeriodMode('monthly')}>
                월별
              </ToggleBtn>
            </ToggleWrap>

            <Filters>
              <Select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {yearOptions.map((item) => (
                  <option key={item} value={item}>{item}년</option>
                ))}
              </Select>
              <Select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {monthOptions.map((item) => (
                  <option key={item} value={item}>{item}월</option>
                ))}
              </Select>
              <IconBtn type="button">▥</IconBtn>
              <IconBtn type="button">↓</IconBtn>
            </Filters>
          </PeriodRow>

          <TableWrap>
            <DataTable>
              <thead>
                <tr>
                  <th>일자</th>
                  <th>주문수</th>
                  <th>매출액</th>
                  <th>구매 전환율</th>
                  <th>페이지뷰</th>
                  <th>방문자</th>
                  <th>주문당 단가</th>
                  <th>가입</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>합계</td>
                  <td>0</td>
                  <td>0원</td>
                  <td>0.00%</td>
                  <td>0</td>
                  <td>0명</td>
                  <td>0원</td>
                  <td>0명</td>
                </tr>
              </tbody>
            </DataTable>
          </TableWrap>
        </Card>
      </BodyPanel>
    </Page>
  );
};

export default SalesManagement;

const Page = styled.div`
  margin: -40px;
  min-height: 100vh;
  background: #f7f5f0;
`;

const HeaderBar = styled.div`
  height: 86px;
  background: #fff;
  border-bottom: 1px solid #ece7de;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;

  h2 {
    font-size: 30px;
    font-weight: 500;
    color: #111827;
  }

  button {
    border: none;
    background: transparent;
    color: #555;
    font-size: 14px;
    cursor: pointer;
  }
`;

const BodyPanel = styled.div`
  background: #f7f5f0;
  min-height: calc(100vh - 86px);
  padding: 24px;
`;

const Card = styled.section`
  background: #fff;
  border: 1px solid #ece7de;
  border-radius: 0;
  padding: 24px;
  margin-bottom: 18px;
`;

const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  h3 {
    font-size: 26px;
    font-weight: 500;
    color: #111827;
  }
`;

const RefreshBtn = styled.button`
  height: 44px;
  padding: 0 18px;
  border: 1px solid #d9d9d9;
  border-radius: 0;
  background: #fff;
  color: #333;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
`;

const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const MetricItem = styled.div`
  min-height: 102px;
  border-radius: 0;
  background: #fcfbf8;
  border: 1px solid #ece7de;
  padding: 18px 20px;

  span {
    color: #555;
    font-size: 14px;
  }

  strong {
    display: block;
    margin-top: 8px;
    color: #111827;
    font-size: 34px;
    line-height: 1;
    font-weight: 700;
  }
`;

const CardTitle = styled.h3`
  font-size: 26px;
  color: #111827;
  font-weight: 500;
  margin-bottom: 16px;
`;

const PeriodRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 12px;

  @media (max-width: 980px) {
    flex-direction: column;
  }
`;

const ToggleWrap = styled.div`
  display: inline-flex;
  gap: 8px;
`;

const ToggleBtn = styled.button<{ $active?: boolean }>`
  height: 44px;
  padding: 0 16px;
  border: 1px solid ${(props) => (props.$active ? '#111827' : '#d9d9d9')};
  border-radius: 0;
  background: ${(props) => (props.$active ? '#333' : '#fff')};
  color: ${(props) => (props.$active ? '#fff' : '#333')};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
`;

const Filters = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const Select = styled.select`
  height: 44px;
  min-width: 116px;
  border: 1px solid #d9d9d9;
  border-radius: 0;
  padding: 0 12px;
  font-size: 14px;
  background: #fff;
`;

const IconBtn = styled.button`
  width: 44px;
  height: 44px;
  border: 1px solid #d9d9d9;
  border-radius: 0;
  background: #fff;
  color: #6b7280;
  font-size: 16px;
  cursor: pointer;
`;

const TableWrap = styled.div`
  overflow-x: auto;
  border: 1px solid #ece7de;
  border-radius: 0;
`;

const DataTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;

  th,
  td {
    border-bottom: 1px solid #ece7de;
    padding: 14px 12px;
    text-align: center;
    white-space: nowrap;
    font-size: 14px;
    color: #1f2937;
  }

  th {
    background: #fcfbf8;
    color: #6f6f6f;
    font-weight: 600;
  }

  td:first-child,
  th:first-child {
    text-align: left;
    padding-left: 20px;
  }
`;