import React from 'react';
import styled from 'styled-components';

const Privacy: React.FC = () => {
  return (
    <Container>
      <Title>개인정보 보호정책</Title>

      <Intro>
        ATTO(이하 "회사")는 「개인정보 보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령에 따라
        이용자의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 아래와 같이
        개인정보 처리방침을 수립·공개합니다.
      </Intro>

      <Section>
        <h2>제1조 (개인정보의 처리목적)</h2>
        <p>회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
        <ol>
          <li><strong>회원 가입 및 관리:</strong> 회원 가입 의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지, 만 14세 미만 아동의 개인정보 처리 시 법정대리인의 동의여부 확인</li>
          <li><strong>재화 또는 서비스 제공:</strong> 물품 배송, 서비스 제공, 계약서·청구서 발송, 콘텐츠 제공, 맞춤형 서비스 제공, 본인인증, 연령인증, 요금 결제·정산</li>
          <li><strong>고충처리:</strong> 민원인 신원 확인, 민원사항 확인, 사실조사를 위한 연락·통지, 처리결과 통보</li>
        </ol>
      </Section>

      <Section>
        <h2>제2조 (개인정보의 처리 및 보유기간)</h2>
        <ol>
          <li>회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</li>
          <li>각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.
            <ul>
              <li>회원 가입 및 관리: 회원 탈퇴 시까지 (단, 관계 법령 위반에 따른 수사·조사 등이 진행 중인 경우에는 해당 수사·조사 종료 시까지)</li>
              <li>전자상거래에서의 계약·청약철회에 관한 기록: 5년</li>
              <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
              <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년</li>
            </ul>
          </li>
        </ol>
      </Section>

      <Section>
        <h2>제3조 (처리하는 개인정보의 항목)</h2>
        <p>회사는 다음의 개인정보 항목을 처리하고 있습니다.</p>
        <ol>
          <li>
            <strong>회원 가입 시 수집항목 (필수)</strong>
            <ul>
              <li>아이디, 비밀번호, 이름, 이메일 주소, 휴대폰 번호</li>
            </ul>
          </li>
          <li>
            <strong>주문 및 배송 시 수집항목 (필수)</strong>
            <ul>
              <li>수령인 이름, 배송지 주소, 휴대폰 번호, 결제 정보</li>
            </ul>
          </li>
          <li>
            <strong>서비스 이용 과정에서 자동 생성·수집되는 항목</strong>
            <ul>
              <li>IP 주소, 쿠키, 서비스 이용 기록, 방문 기록</li>
            </ul>
          </li>
        </ol>
      </Section>

      <Section>
        <h2>제4조 (개인정보의 제3자 제공)</h2>
        <p>
          회사는 정보주체의 개인정보를 제1조(개인정보의 처리목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 「개인정보 보호법」 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.
        </p>
        <p style={{ marginTop: '8px' }}>
          단, 배송 서비스 제공을 위해 아래와 같이 최소한의 개인정보를 제공합니다.
        </p>
        <ul>
          <li>제공받는 자: 배송 업체 (CJ대한통운 등)</li>
          <li>제공 목적: 상품 배송</li>
          <li>제공 항목: 수령인 이름, 주소, 연락처</li>
          <li>보유 기간: 배송 완료 후 즉시 파기</li>
        </ul>
      </Section>

      <Section>
        <h2>제5조 (개인정보 처리의 위탁)</h2>
        <p>
          회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.
        </p>
        <ul>
          <li>결제 처리: PG사(카카오페이, 토스페이 등)</li>
          <li>시스템 운영 및 관리: 클라우드 서버 운영사</li>
        </ul>
      </Section>

      <Section>
        <h2>제6조 (정보주체의 권리·의무 및 행사방법)</h2>
        <ol>
          <li>정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.
            <ul>
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구</li>
              <li>처리정지 요구</li>
            </ul>
          </li>
          <li>권리 행사는 회사에 대해 「개인정보 보호법」 시행령 제41조 제1항에 따라 서면, 전자우편 등을 통하여 하실 수 있으며, 회사는 이에 대해 지체없이 조치하겠습니다.</li>
        </ol>
      </Section>

      <Section>
        <h2>제7조 (개인정보의 파기)</h2>
        <ol>
          <li>회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</li>
          <li>개인정보 파기의 절차 및 방법은 다음과 같습니다.
            <ul>
              <li><strong>파기절차:</strong> 불필요한 개인정보 및 개인정보파일은 개인정보 보호책임자의 책임 하에 내부 방침 절차에 따라 파기합니다.</li>
              <li><strong>파기방법:</strong> 전자적 파일 형태로 기록·저장된 개인정보는 기록을 재생할 수 없도록 기술적 방법을 이용하여 파기하며, 종이 문서는 분쇄기로 분쇄하여 파기합니다.</li>
            </ul>
          </li>
        </ol>
      </Section>

      <Section>
        <h2>제8조 (쿠키의 사용)</h2>
        <p>
          회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용자의 정보를 저장하고 수시로 불러오는 '쿠키(cookie)'를 사용합니다. 이용자는 웹 브라우저 옵션 설정을 통해 쿠키 허용 여부를 선택할 수 있습니다. 단, 쿠키 저장을 거부할 경우 일부 서비스 이용에 어려움이 있을 수 있습니다.
        </p>
      </Section>

      <Section>
        <h2>제9조 (개인정보 보호책임자)</h2>
        <p>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
        <InfoBox>
          <p><strong>개인정보 보호책임자</strong></p>
          <p>성명: 이영주</p>
          <p>연락처: 010-2531-8341</p>
          <p>이메일: atto@atto.live</p>
        </InfoBox>
      </Section>

      <Section>
        <h2>제10조 (개인정보 처리방침 변경)</h2>
        <p>
          이 개인정보 처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경 내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행일로부터 7일 전부터 공지사항을 통하여 고지할 것입니다.
        </p>
      </Section>

      <UpdateDate>시행일: 2025년 1월 1일</UpdateDate>
    </Container>
  );
};

export default Privacy;

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 60px 24px 80px;

  @media (max-width: 640px) {
    padding: 40px 16px 60px;
  }
`;

const Title = styled.h1`
  font-size: 28px;
  font-family: 'Playfair Display', serif;
  color: #1a1a1a;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0dbd4;
`;

const Intro = styled.p`
  font-size: 14px;
  color: #555;
  line-height: 1.8;
  margin-bottom: 40px;
`;

const Section = styled.section`
  margin-bottom: 36px;

  h2 {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 12px;
  }

  p {
    font-size: 14px;
    color: #555;
    line-height: 1.8;
  }

  ol, ul {
    padding-left: 20px;
    margin-top: 8px;
  }

  li {
    font-size: 14px;
    color: #555;
    line-height: 1.8;
    margin-bottom: 6px;
  }

  ul {
    list-style: disc;
    margin-top: 6px;
    margin-bottom: 6px;
  }

  strong {
    color: #333;
  }
`;

const InfoBox = styled.div`
  margin-top: 12px;
  padding: 16px 20px;
  background: #f6f4ef;
  border-radius: 8px;
  border: 1px solid #e0dbd4;

  p {
    font-size: 14px;
    color: #555;
    line-height: 1.8;
  }
`;

const UpdateDate = styled.p`
  font-size: 13px;
  color: #999;
  margin-top: 48px;
  text-align: right;
`;
