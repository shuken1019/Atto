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
  const dataRows = useMemo(
    () => [
      {
        date: '합계',
        orders: '0',
        sales: '0원',
        conversion: '0.00%',
        pageViews: '0',
        visitors: '0명',
        avgOrderPrice: '0원',
        signups: '0명',
      },
    ],
    [],
  );

  return (
    <Page>
      <HeaderBar>
        <h2>매출</h2>
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
                {dataRows.map((row) => (
                  <tr key={row.date}>
                    <td>{row.date}</td>
                    <td>{row.orders}</td>
                    <td>{row.sales}</td>
                    <td>{row.conversion}</td>
                    <td>{row.pageViews}</td>
                    <td>{row.visitors}</td>
                    <td>{row.avgOrderPrice}</td>
                    <td>{row.signups}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </TableWrap>

          <MobileDataList>
            {dataRows.map((row) => (
              <MobileDataCard key={`mobile-${row.date}`}>
                <h4>{row.date}</h4>
                <dl>
                  <div><dt>주문수</dt><dd>{row.orders}</dd></div>
                  <div><dt>매출액</dt><dd>{row.sales}</dd></div>
                  <div><dt>구매 전환율</dt><dd>{row.conversion}</dd></div>
                  <div><dt>페이지뷰</dt><dd>{row.pageViews}</dd></div>
                  <div><dt>방문자</dt><dd>{row.visitors}</dd></div>
                  <div><dt>주문당 단가</dt><dd>{row.avgOrderPrice}</dd></div>
                  <div><dt>가입</dt><dd>{row.signups}</dd></div>
                </dl>
              </MobileDataCard>
            ))}
          </MobileDataList>
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

  @media (max-width: 760px) {
    height: 74px;
    padding: 0 16px;

    h2 {
      font-size: 24px;
    }
  }
`;

const BodyPanel = styled.div`
  background: #f7f5f0;
  min-height: calc(100vh - 86px);
  padding: 24px;

  @media (max-width: 760px) {
    padding: 12px;
  }
`;

const Card = styled.section`
  background: #fff;
  border: 1px solid #ece7de;
  border-radius: 0;
  padding: 24px;
  margin-bottom: 18px;

  @media (max-width: 760px) {
    padding: 14px;
    margin-bottom: 12px;
  }
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

  @media (max-width: 760px) {
    h3 {
      font-size: 20px;
    }
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
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  @media (max-width: 420px) {
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

  @media (max-width: 760px) {
    min-height: 84px;
    padding: 12px;

    span {
      font-size: 12px;
    }

    strong {
      font-size: 24px;
      margin-top: 6px;
    }
  }
`;

const CardTitle = styled.h3`
  font-size: 26px;
  color: #111827;
  font-weight: 500;
  margin-bottom: 16px;

  @media (max-width: 760px) {
    font-size: 20px;
    margin-bottom: 12px;
  }
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

  @media (max-width: 760px) {
    width: 100%;
    flex-wrap: wrap;
    gap: 8px;
  }
`;

const Select = styled.select`
  height: 44px;
  min-width: 116px;
  border: 1px solid #d9d9d9;
  border-radius: 0;
  padding: 0 12px;
  font-size: 14px;
  background: #fff;

  @media (max-width: 760px) {
    flex: 1;
    min-width: 0;
  }
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

  @media (max-width: 760px) {
    display: none;
  }
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

const MobileDataList = styled.div`
  display: none;

  @media (max-width: 760px) {
    display: grid;
    gap: 10px;
  }
`;

const MobileDataCard = styled.article`
  border: 1px solid #ece7de;
  background: #fcfbf8;
  padding: 12px;

  h4 {
    font-size: 14px;
    color: #111827;
    margin-bottom: 8px;
    font-weight: 700;
  }

  dl {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 10px;
  }

  div {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    border-bottom: 1px dashed #e6e1d8;
    padding-bottom: 3px;
  }

  dt,
  dd {
    margin: 0;
    font-size: 12px;
    color: #4b5563;
  }

  dd {
    color: #111827;
    font-weight: 600;
  }
`;
