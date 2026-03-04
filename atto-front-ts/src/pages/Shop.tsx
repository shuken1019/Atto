// src/pages/Shop.tsx
import React, { useEffect, useState, useMemo } from 'react'; // ⭐️ useMemo 추가
import styled from 'styled-components';
import ProductCard from '../components/product/ProductCard';
import { getProducts } from '../services/productService';
import type { IProduct, CategoryType } from '../types/product';

// 필터 타입 정의
type FilterType = CategoryType | 'all';
type SortType = 'newest' | 'popular';

const Shop: React.FC = () => {
  const [products, setProducts] = useState<IProduct[]>([]); // 전체 데이터
  
  // 상태 관리
  const [selectedCategory, setSelectedCategory] = useState<FilterType>('all');
  const [sortOption, setSortOption] = useState<SortType>('newest');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. 데이터 불러오기
  useEffect(() => {
    getProducts().then((data) => {
      setProducts(data);
    });
  }, []);

  // ⭐️ 2. 필터링 및 정렬 로직 (useEffect 대신 useMemo 사용!)
  // products, selectedCategory, sortOption, searchQuery가 바뀔 때만 다시 계산합니다.
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // (1) 카테고리 필터
    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // (2) 검색어 필터
    const keyword = searchQuery.trim().toLowerCase();
    if (keyword) {
      result = result.filter((p) => p.name.toLowerCase().includes(keyword));
    }

    // (3) 정렬
    if (sortOption === 'newest') {
      result.sort((a, b) => b.id - a.id);
    } else if (sortOption === 'popular') {
      // 인기순 로직 (가격 높은순 임시 적용)
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, selectedCategory, sortOption, searchQuery]);

  // 카테고리 목록
  const categories: { id: FilterType; label: string }[] = [
    { id: 'all', label: '전체' },
    { id: 'outer', label: '아우터' },
    { id: 'top', label: '상의' },
    { id: 'bottom', label: '하의' },
    { id: 'acc', label: '악세서리' },
  ];

  return (
    <ShopContainer>
      <ShopLayout>
        {/* 왼쪽 사이드바: 카테고리 */}
        <Sidebar>
          <SidebarHeader>
            <h3>Categories</h3>
            <MobileSearchInput
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="상품 검색"
              aria-label="상품 검색"
            />
          </SidebarHeader>
          <ul>
            {categories.map((cat) => (
              <li key={cat.id}>
                <CategoryButton 
                  $active={selectedCategory === cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.label}
                </CategoryButton>
              </li>
            ))}
          </ul>
        </Sidebar>

        {/* 오른쪽 컨텐츠: 정렬 + 상품 목록 */}
        <ContentArea>
          <SortBar>
            <SortButtons>
              <DesktopSearchInput
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="상품 검색"
                aria-label="상품 검색"
              />
              <SortButton 
                $active={sortOption === 'newest'} 
                onClick={() => setSortOption('newest')}
              >
                최신순
              </SortButton>
              <Divider>|</Divider>
              <SortButton 
                $active={sortOption === 'popular'} 
                onClick={() => setSortOption('popular')}
              >
                인기순
              </SortButton>
            </SortButtons>
          </SortBar>

          {filteredProducts.length > 0 ? (
            <ProductGrid>
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </ProductGrid>
          ) : (
            <EmptyState>해당하는 상품이 없습니다.</EmptyState>
          )}
        </ContentArea>
      </ShopLayout>
    </ShopContainer>
  );
};

export default Shop;

// ---------- Styled Components ----------

const ShopContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 40px 100px;

  @media (max-width: 900px) {
    padding: 32px 20px 90px;
  }

  @media (max-width: 640px) {
    padding: 26px 14px 70px;
  }
`;

const ShopLayout = styled.div`
  display: flex;
  gap: 60px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 30px;
  }
`;

const Sidebar = styled.aside`
  width: 200px;
  flex-shrink: 0;

  h3 {
    display: flex;
    align-items: flex-end;
    height: 44px;
    font-size: 18px;
    margin: 0 0 24px;
    padding-bottom: 12px;
  }

  ul {
    list-style: none;
    padding: 0;
  }

  li {
    margin-bottom: 12px;
  }

  @media (max-width: 768px) {
    width: 100%;

    h3 {
      height: auto;
      border-bottom: none;
      margin: 0;
      padding: 0;
      font-size: 16px;
    }

    ul {
      margin-top: 12px;
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 8px;
      padding-bottom: 6px;
    }

    li {
      margin-bottom: 0;
    }
  }
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid #ddd;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    align-items: center;
    margin-bottom: 0;
    padding-bottom: 8px;
  }
`;

const MobileSearchInput = styled.input`
  display: none;
  width: 180px;
  max-width: 58%;
  height: 32px;
  border: 1px solid #ddd;
  border-radius: 999px;
  padding: 0 12px;
  font-size: 12px;
  color: #333;
  background: #fff;

  &:focus {
    outline: none;
    border-color: #999;
  }

  &::placeholder {
    color: #aaa;
  }

  @media (max-width: 768px) {
    display: block;
  }
`;

const ContentArea = styled.div`
  flex: 1;
`;

const SortBar = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  gap: 16px;
  height: 44px;
  margin: 0 0 30px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;

  @media (max-width: 640px) {
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 20px;
  }
`;

const DesktopSearchInput = styled.input`
  width: 220px;
  height: 34px;
  border: 1px solid #ddd;
  border-radius: 999px;
  padding: 0 14px;
  font-size: 13px;
  color: #333;
  background: #fff;

  &:focus {
    outline: none;
    border-color: #999;
  }

  &::placeholder {
    color: #aaa;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const SortButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  @media (max-width: 768px) {
    justify-content: flex-end;
    width: 100%;
  }
`;

const SortButton = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  font-size: 14px;
  cursor: pointer;
  color: ${(props) => (props.$active ? '#000' : '#999')};
  font-weight: ${(props) => (props.$active ? '600' : '400')};
  padding: 0;
`;

const Divider = styled.span`
  color: #ddd !important;
  font-size: 12px !important;
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px 20px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 22px 12px;
  }

  @media (max-width: 390px) {
    grid-template-columns: 1fr;
  }
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 420px;
  color: #888;
  font-size: 16px;
`;
const CategoryButton = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  font-size: 15px;
  cursor: pointer;
  color: ${(props) => (props.$active ? '#000' : '#888')};
  font-weight: ${(props) => (props.$active ? '600' : '400')};
  padding: 0;
  transition: color 0.2s;
  font-family: 'Noto Sans KR', sans-serif;

  &:hover {
    color: #333;
  }

  @media (max-width: 768px) {
    border: 1px solid ${(props) => (props.$active ? '#333' : '#d5d5d5')};
    border-radius: 999px;
    padding: 8px 14px;
    font-size: 13px;
    white-space: nowrap;
  }
`;
