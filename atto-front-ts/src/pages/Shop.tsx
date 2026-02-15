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

  // 1. 데이터 불러오기
  useEffect(() => {
    getProducts().then((data) => {
      setProducts(data);
    });
  }, []);

  // ⭐️ 2. 필터링 및 정렬 로직 (useEffect 대신 useMemo 사용!)
  // products, selectedCategory, sortOption이 바뀔 때만 다시 계산합니다.
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // (1) 카테고리 필터
    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // (2) 정렬
    if (sortOption === 'newest') {
      result.sort((a, b) => b.id - a.id);
    } else if (sortOption === 'popular') {
      // 인기순 로직 (가격 높은순 임시 적용)
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, selectedCategory, sortOption]);

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
      <PageHeader>
        <h2>Shop</h2>
        <p>Natural mood, comfortable daily wear.</p>
      </PageHeader>

      <ShopLayout>
        {/* 왼쪽 사이드바: 카테고리 */}
        <Sidebar>
          <h3>Categories</h3>
          <ul>
            {categories.map((cat) => (
              <li key={cat.id}>
                <CategoryButton 
                  active={selectedCategory === cat.id}
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
            <span>Total {filteredProducts.length} items</span>
            <SortButtons>
              <SortButton 
                active={sortOption === 'newest'} 
                onClick={() => setSortOption('newest')}
              >
                최신순
              </SortButton>
              <Divider>|</Divider>
              <SortButton 
                active={sortOption === 'popular'} 
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
  padding: 40px 20px 100px;

  @media (max-width: 640px) {
    padding: 26px 14px 70px;
  }
`;

const PageHeader = styled.div`
  text-align: center;
  margin-bottom: 60px;
  
  h2 {
    font-size: 36px;
    margin-bottom: 12px;
    font-weight: 400;
  }
  p {
    color: #666;
    font-size: 15px;
  }

  @media (max-width: 640px) {
    margin-bottom: 34px;

    h2 {
      font-size: 30px;
      margin-bottom: 8px;
    }

    p {
      font-size: 14px;
    }
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
    font-size: 18px;
    margin-bottom: 24px;
    border-bottom: 1px solid #ddd;
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
      margin-bottom: 12px;
      padding-bottom: 8px;
      font-size: 16px;
    }

    ul {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 6px;
      -webkit-overflow-scrolling: touch;
    }

    li {
      margin-bottom: 0;
      flex: 0 0 auto;
    }
  }
`;

const CategoryButton = styled.button<{ active: boolean }>`
  background: none;
  border: none;
  font-size: 15px;
  cursor: pointer;
  color: ${(props) => (props.active ? '#000' : '#888')};
  font-weight: ${(props) => (props.active ? '600' : '400')};
  padding: 0;
  transition: color 0.2s;
  font-family: 'Noto Sans KR', sans-serif;

  &:hover {
    color: #333;
  }

  @media (max-width: 768px) {
    border: 1px solid ${(props) => (props.active ? '#333' : '#d5d5d5')};
    border-radius: 999px;
    padding: 8px 14px;
    font-size: 13px;
    white-space: nowrap;
  }
`;

const ContentArea = styled.div`
  flex: 1;
`;

const SortBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  
  span {
    font-size: 14px;
    color: #666;
  }

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 20px;
  }
`;

const SortButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SortButton = styled.button<{ active: boolean }>`
  background: none;
  border: none;
  font-size: 14px;
  cursor: pointer;
  color: ${(props) => (props.active ? '#000' : '#999')};
  font-weight: ${(props) => (props.active ? '600' : '400')};
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
  text-align: center;
  padding: 100px 0;
  color: #888;
  font-size: 16px;
`;
