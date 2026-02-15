// src/components/common/Placeholders.tsx
import React from 'react';
import styled from 'styled-components';

// 1. 메인 배너용 SVG 컴포넌트
export const MainBannerSVG = () => (
  <SvgWrapper viewBox="0 0 1600 600">
    <rect width="1600" height="600" fill="#EBE7E0" />
    <circle cx="1400" cy="300" r="250" fill="#D6D0C2" opacity="0.5" />
    <circle cx="200" cy="500" r="300" fill="#D6D0C2" opacity="0.3" />
    <text x="50%" y="45%" dominantBaseline="middle" textAnchor="middle" 
          fontFamily="'Playfair Display', serif" fontSize="80" fill="#333" letterSpacing="10">
      ESSENTIALS
    </text>
    <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" 
          fontFamily="'Noto Sans KR', sans-serif" fontSize="24" fill="#555" letterSpacing="4">
      SPRING / SUMMER 2024
    </text>
    <line x1="700" y1="320" x2="900" y2="320" stroke="#333" strokeWidth="2" />
  </SvgWrapper>
);

// 2. 상품 이미지용 SVG 컴포넌트 (타입에 따라 다른 그림)
export const ProductImageSVG: React.FC<{ type?: string }> = ({ type }) => {
  // 타입에 따라 배경색과 텍스트를 조금씩 다르게
  const getColor = () => {
    if (type === 'outer') return { bg: '#E5E2DA', text: 'OUTER' }; // 연한 회베이지
    if (type === 'bottom') return { bg: '#DCD9D2', text: 'BOTTOM' }; // 진한 베이지
    return { bg: '#F0EFE9', text: 'TOP' }; // 밝은 크림
  };
  
  const { bg, text } = getColor();

  return (
    <SvgWrapper viewBox="0 0 300 400">
      <rect width="300" height="400" fill={bg} />
      {/* 옷걸이 모양 심볼 */}
      <path d="M150 120 C150 100, 130 100, 130 110" stroke="#888" strokeWidth="2" fill="none" />
      <path d="M100 140 L150 120 L200 140 L200 150" stroke="#888" strokeWidth="2" fill="none" />
      
      <text x="50%" y="60%" dominantBaseline="middle" textAnchor="middle" 
            fontFamily="'Playfair Display', serif" fontSize="24" fill="#666" letterSpacing="3">
        {text}
      </text>
      <text x="50%" y="70%" dominantBaseline="middle" textAnchor="middle" 
            fontFamily="'Noto Sans KR', sans-serif" fontSize="12" fill="#888" letterSpacing="1">
        ATTO COLLECTION
      </text>
    </SvgWrapper>
  );
};

const SvgWrapper = styled.svg`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;