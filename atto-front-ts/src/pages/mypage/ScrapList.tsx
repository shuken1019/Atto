import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import ProductCard from '../../components/product/ProductCard';
import { getProducts } from '../../services/productService';
import { getScraps, removeScrap } from '../../services/scrapService';
import type { IProduct } from '../../types/product';

type ScrapItem = {
  scrapId: number;
  userId: number;
  productId: number;
  created_at: string;
};

const ScrapList: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [scraps, setScraps] = useState<ScrapItem[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [scrapData, allProducts] = await Promise.all([getScraps(), getProducts()]);
      setScraps(scrapData);
      setProducts(allProducts);
    } catch (error) {
      alert(error instanceof Error ? error.message : '스크랩 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRemove = async (productId: number) => {
    try {
      await removeScrap(productId);
      await load();
    } catch (error) {
      alert(error instanceof Error ? error.message : '스크랩 삭제에 실패했습니다.');
    }
  };

  const scrapProducts = scraps
    .map((scrap) => ({ scrap, product: products.find((p) => p.id === Number(scrap.productId)) }))
    .filter((item): item is { scrap: ScrapItem; product: IProduct } => Boolean(item.product));

  return (
    <Container>
      <Title>My Scraps ({scrapProducts.length})</Title>

      {loading ? (
        <EmptyText>불러오는 중...</EmptyText>
      ) : scrapProducts.length === 0 ? (
        <EmptyText>스크랩한 상품이 없습니다.</EmptyText>
      ) : (
        <Grid>
          {scrapProducts.map(({ scrap, product }) => (
            <CardWrap key={scrap.scrapId}>
              <ProductCard product={product} initialScrapped />
              <RemoveButton type="button" onClick={() => handleRemove(product.id)}>
                스크랩 삭제
              </RemoveButton>
            </CardWrap>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default ScrapList;

const Container = styled.div`
  width: 100%;
`;

const Title = styled.h2`
  font-size: 24px;
  font-family: 'Playfair Display', serif;
  margin-bottom: 30px;
  border-bottom: 1px solid #ddd;
  padding-bottom: 15px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const CardWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const RemoveButton = styled.button`
  border: 1px solid #ddd;
  background: #fff;
  color: #555;
  font-size: 12px;
  padding: 8px 10px;
  cursor: pointer;

  &:hover {
    border-color: #333;
    color: #111;
  }
`;

const EmptyText = styled.p`
  padding: 40px 0;
  color: #777;
  font-size: 14px;
`;
