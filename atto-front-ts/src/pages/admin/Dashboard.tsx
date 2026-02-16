import React from 'react';
import styled from 'styled-components';

const dailyStats = [
  { date: '2026-02-10', pageView: 0, visitors: 0, signups: 0, likes: 0, comments: 0 },
  { date: '2026-02-11', pageView: 0, visitors: 0, signups: 0, likes: 0, comments: 0 },
  { date: '2026-02-12', pageView: 0, visitors: 0, signups: 0, likes: 0, comments: 0 },
  { date: '2026-02-13', pageView: 0, visitors: 0, signups: 0, likes: 0, comments: 0 },
  { date: '2026-02-14', pageView: 0, visitors: 0, signups: 0, likes: 0, comments: 0 },
  { date: '2026-02-15', pageView: 0, visitors: 0, signups: 0, likes: 0, comments: 0 },
  { date: '2026-02-16', pageView: 1, visitors: 1, signups: 0, likes: 0, comments: 0 },
];

const shortDates = ['02-10', '02-11', '02-12', '02-13', '02-14', '02-15', '02-16'];
const lowStockItems = [
  { name: 'Relaxed Tate-shirt', option: 'Beige / M', stock: 2 },
  { name: 'Wide Cotton Pants', option: 'Black / S', stock: 0 },
];

const Dashboard: React.FC = () => {
  const total7Days = dailyStats.reduce(
    (acc, item) => ({
      pageView: acc.pageView + item.pageView,
      visitors: acc.visitors + item.visitors,
      signups: acc.signups + item.signups,
      likes: acc.likes + item.likes,
      comments: acc.comments + item.comments,
    }),
    { pageView: 0, visitors: 0, signups: 0, likes: 0, comments: 0 },
  );

  return (
    <Page>
      <StockAlertCard>
        <CardHead>
          <h3>재고 알림</h3>
        </CardHead>
        <AlertBody>
          {lowStockItems.map((item) => (
            <AlertItem key={`${item.name}-${item.option}`} $isCritical={item.stock === 0}>
              <span>
                {item.name} ({item.option})
              </span>
              <strong>{item.stock === 0 ? '품절' : `${item.stock}개 남음`}</strong>
            </AlertItem>
          ))}
        </AlertBody>
      </StockAlertCard>

      <SectionTitle>
        <BlueDot /> 통계
      </SectionTitle>

      <StatGrid>
        <Card>
          <CardHead>
            <h3>방문자</h3>
            <MoreButton type="button">더보기</MoreButton>
          </CardHead>
          <ChartWrap>
            <Legend>
              <span><LegendDot $tone="view" />페이지뷰</span>
              <span><LegendDot $tone="visitor" />방문자</span>
            </Legend>
            <ChartArea>
              {shortDates.map((date, idx) => (
                <GridCol key={date}>
                  <GridLine />
                  <Dot $active={idx === shortDates.length - 1} />
                  <DateLabel>{date}</DateLabel>
                </GridCol>
              ))}
              <RiseArea />
            </ChartArea>
          </ChartWrap>
        </Card>

        <Card>
          <CardHead>
            <h3>기간별 분석</h3>
            <MoreButton type="button">더보기</MoreButton>
          </CardHead>
          <TableWrap>
            <StatTable>
              <thead>
                <tr>
                  <th>일자</th>
                  <th>페이지뷰</th>
                  <th>방문자</th>
                  <th>가입</th>
                  <th>새 글</th>
                  <th>댓글</th>
                </tr>
              </thead>
              <tbody>
                {dailyStats
                  .slice()
                  .reverse()
                  .map((row, idx) => (
                    <tr key={row.date} className={idx === 0 ? 'highlight' : ''}>
                      <td>{row.date}</td>
                      <td>{row.pageView}</td>
                      <td>{row.visitors}</td>
                      <td>{row.signups}</td>
                      <td>{row.likes}</td>
                      <td>{row.comments}</td>
                    </tr>
                  ))}
                <tr className="sum">
                  <td>최근 7일 합계</td>
                  <td>{total7Days.pageView}</td>
                  <td>{total7Days.visitors}명</td>
                  <td>{total7Days.signups}명</td>
                  <td>{total7Days.likes}</td>
                  <td>{total7Days.comments}</td>
                </tr>
                <tr className="sum">
                  <td>이번달 합계</td>
                  <td>{total7Days.pageView}</td>
                  <td>{total7Days.visitors}명</td>
                  <td>{total7Days.signups}명</td>
                  <td>{total7Days.likes}</td>
                  <td>{total7Days.comments}</td>
                </tr>
              </tbody>
            </StatTable>
          </TableWrap>
        </Card>
      </StatGrid>

      <SectionTitle>
        <YellowDot /> 콘텐츠
      </SectionTitle>

      <ContentGrid>
        <Card>
          <CardHead>
            <h3>사용자 목록</h3>
            <MoreButton type="button">더보기</MoreButton>
          </CardHead>
          <UserRow>
            <Avatar />
            <UserInfo>
              <strong>관리자</strong>
              <p>shuken1019@gmail.com / 2025-12-29 18:22</p>
            </UserInfo>
          </UserRow>
        </Card>

        <Card>
          <CardHead>
            <h3>컨텐츠 반응</h3>
            <MoreButton type="button">더보기</MoreButton>
          </CardHead>
          <EmptyState>
            <EmptyFileIcon />
            <p>컨텐츠 반응이 없어요</p>
          </EmptyState>
        </Card>
      </ContentGrid>
    </Page>
  );
};

export default Dashboard;

const Page = styled.div`
  padding: 24px;
  background: #f7f5f0;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-family: 'Noto Sans KR', sans-serif;
  font-weight: 600;
  color: #111827;
  margin: 6px 0 14px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const BlueDot = styled.span`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #0ea5e9;
`;

const YellowDot = styled(BlueDot)`
  background: #f59e0b;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const ContentGrid = styled(StatGrid)`
  margin-top: 10px;
`;

const Card = styled.section`
  border-radius: 0;
  overflow: hidden;
  background: #fff;
  border: 1px solid #ece7de;
`;

const StockAlertCard = styled(Card)`
  margin-bottom: 14px;
`;

const CardHead = styled.div`
  height: 66px;
  padding: 0 18px;
  border-bottom: 1px solid #ece7de;
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 {
    font-size: 18px;
    font-weight: 500;
    color: #111827;
  }
`;

const MoreButton = styled.button`
  border: none;
  background: transparent;
  color: #6f6f6f;
  font-size: 13px;
  cursor: pointer;
`;

const AlertBody = styled.div`
  padding: 14px 18px;
`;

const AlertItem = styled.div<{ $isCritical: boolean }>`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #ece7de;
  color: ${(props) => (props.$isCritical ? '#dc2626' : '#374151')};

  strong {
    font-weight: ${(props) => (props.$isCritical ? 700 : 600)};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const ChartWrap = styled.div`
  padding: 18px;
`;

const Legend = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 22px;
  margin-bottom: 12px;

  span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #374151;
    font-size: 13px;
  }

`;

const LegendDot = styled.span<{ $tone: 'view' | 'visitor' }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
  background: ${(props) => (props.$tone === 'visitor' ? '#2563eb' : '#93c5fd')};
`;

const ChartArea = styled.div`
  height: 380px;
  border: 1px solid #ece7de;
  border-left: none;
  border-top: none;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  position: relative;
`;

const GridCol = styled.div`
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 34px;
`;

const GridLine = styled.div`
  position: absolute;
  top: 0;
  bottom: 34px;
  width: 1px;
  background: #ece7de;
`;

const Dot = styled.span<{ $active?: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${(props) => (props.$active ? '#2563eb' : '#3b82f6')};
  position: relative;
  z-index: 3;
`;

const RiseArea = styled.div`
  position: absolute;
  right: 0;
  bottom: 34px;
  width: 15%;
  height: 74%;
  background: rgba(56, 189, 248, 0.4);
  clip-path: polygon(100% 100%, 0 100%, 100% 0);
`;

const DateLabel = styled.span`
  position: absolute;
  bottom: 6px;
  font-size: 12px;
  color: #6b7280;
`;

const TableWrap = styled.div`
  overflow-x: auto;
  background: #fff;
`;

const StatTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 11px 12px;
    border-bottom: 1px solid #ece7de;
    font-size: 13px;
    text-align: center;
    white-space: nowrap;
  }

  th {
    color: #6f6f6f;
    font-weight: 600;
    background: #fcfbf8;
  }

  td:first-child,
  th:first-child {
    text-align: left;
    padding-left: 16px;
  }

  tr.highlight {
    background: #f6f2e9;
  }

  tr.sum {
    background: #fcfbf8;
  }
`;

const UserRow = styled.div`
  padding: 26px 22px;
  display: flex;
  align-items: center;
  gap: 14px;
`;

const Avatar = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #e5e7eb;
`;

const UserInfo = styled.div`
  strong {
    display: block;
    font-size: 16px;
    margin-bottom: 4px;
  }

  p {
    font-size: 14px;
    color: #6b7280;
  }
`;

const EmptyState = styled.div`
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  gap: 10px;

  p {
    font-size: 15px;
  }
`;

const EmptyFileIcon = styled.div`
  width: 40px;
  height: 50px;
  border-radius: 8px;
  background: #d1d5db;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    right: 0;
    top: 0;
    width: 12px;
    height: 12px;
    background: #e5e7eb;
    clip-path: polygon(0 0, 100% 100%, 0 100%);
  }
`;
