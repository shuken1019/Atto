import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import type { CategoryType } from '../../types/product';
import { ProductImageSVG } from '../../components/common/Placeholders';
import { useParams } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import { authFetch } from '../../utils/authFetch';

type AdminColor = {
  colorId: number;
  name: string;
  code: string;
};

type AdminSize = {
  sizeId: number;
  label: 'S' | 'M' | 'L';
};

type AdminProductOption = {
  optionId?: number;
  productId?: number;
  colorId: number;
  sizeId: number;
  stock: number;
  additionalPrice?: number;
};

const FALLBACK_COLORS: AdminColor[] = [
  { colorId: 1, name: 'Black', code: '#222222' },
  { colorId: 2, name: 'Ivory', code: '#efe9de' },
  { colorId: 3, name: 'White', code: '#ffffff' },
  { colorId: 4, name: 'Gray', code: '#a5a5a5' },
  { colorId: 5, name: 'Navy', code: '#1f2c56' },
  { colorId: 6, name: 'Charcoal', code: '#3d3d3d' },
  { colorId: 7, name: 'Light Gray', code: '#d8d8d8' },
  { colorId: 8, name: 'Cream', code: '#f7efd9' },
  { colorId: 9, name: 'Beige', code: '#d8c3a5' },
  { colorId: 10, name: 'Oatmeal', code: '#c9bba6' },
  { colorId: 11, name: 'Camel', code: '#b7834f' },
  { colorId: 12, name: 'Brown', code: '#74513b' },
  { colorId: 13, name: 'Chocolate', code: '#4a2f25' },
  { colorId: 14, name: 'Blue', code: '#3b73c8' },
  { colorId: 15, name: 'Sky Blue', code: '#9ec7e8' },
  { colorId: 16, name: 'Denim', code: '#466b8f' },
  { colorId: 17, name: 'Green', code: '#2f7d53' },
  { colorId: 18, name: 'Khaki', code: '#8b8756' },
  { colorId: 19, name: 'Olive', code: '#5f6b3d' },
  { colorId: 20, name: 'Mint', code: '#a8d8c4' },
  { colorId: 21, name: 'Yellow', code: '#f0cf5a' },
  { colorId: 22, name: 'Orange', code: '#df8b3a' },
  { colorId: 23, name: 'Red', code: '#c9473f' },
  { colorId: 24, name: 'Burgundy', code: '#7b2638' },
  { colorId: 25, name: 'Pink', code: '#e8a7b8' },
  { colorId: 26, name: 'Rose', code: '#c98089' },
  { colorId: 27, name: 'Lavender', code: '#b9a7d8' },
  { colorId: 28, name: 'Purple', code: '#76559d' },
  { colorId: 29, name: 'Silver', code: '#c9cbd0' },
  { colorId: 30, name: 'Gold', code: '#c8a64d' },
];

const AVAILABLE_SIZES: AdminSize[] = [
  { sizeId: 1, label: 'S' },
  { sizeId: 2, label: 'M' },
  { sizeId: 3, label: 'L' },
];

const categoryFromId = (categoryId: number): CategoryType => {
  if (categoryId === 1) return 'outer';
  if (categoryId === 2) return 'top';
  if (categoryId === 3) return 'bottom';
  if (categoryId === 4) return 'acc';
  return 'top';
};

const ProductUpload = () => {
  const { id } = useParams<{ id?: string }>();
  const productId = Number(id);
  const isEditMode = Number.isInteger(productId) && productId > 0;

  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryType>('top');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState('');
  const [thumbnailPath, setThumbnailPath] = useState('');
  type DetailBlock = { file: File; previewUrl: string; text: string };
  const [detailBlocks, setDetailBlocks] = useState<DetailBlock[]>([]);
  const detailBlockUrlsRef = useRef<string[]>([]);
  const [availableColors, setAvailableColors] = useState<AdminColor[]>(FALLBACK_COLORS);
  const [selectedSizeIds, setSelectedSizeIds] = useState<number[]>([]);
  const [activeSizeId, setActiveSizeId] = useState<number | null>(null);
  const [sizeColorSelections, setSizeColorSelections] = useState<Record<number, number[]>>({});
  const [optionStocks, setOptionStocks] = useState<Record<string, string>>({});
  const [initialOptionStocks, setInitialOptionStocks] = useState<Record<string, number>>({});
  const [customColorCode, setCustomColorCode] = useState('#c9473f');
  const [customColorName, setCustomColorName] = useState('');
  const [customColorPending, setCustomColorPending] = useState(false);
  const [loadingEditData, setLoadingEditData] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      detailBlockUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const addDetailBlocks = useCallback((files: File[]) => {
    const newBlocks = files.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      detailBlockUrlsRef.current.push(previewUrl);
      return { file, previewUrl, text: '' };
    });
    setDetailBlocks((prev) => [...prev, ...newBlocks].slice(0, 10));
  }, []);

  const removeDetailBlock = useCallback((idx: number) => {
    setDetailBlocks((prev) => {
      const block = prev[idx];
      if (block) {
        URL.revokeObjectURL(block.previewUrl);
        detailBlockUrlsRef.current = detailBlockUrlsRef.current.filter((u) => u !== block.previewUrl);
      }
      return prev.filter((_, i) => i !== idx);
    });
  }, []);

  const updateDetailBlockText = useCallback((idx: number, text: string) => {
    setDetailBlocks((prev) => prev.map((b, i) => (i === idx ? { ...b, text } : b)));
  }, []);

  useEffect(() => {
    return () => {
      if (thumbnailPreviewUrl) {
        URL.revokeObjectURL(thumbnailPreviewUrl);
      }
    };
  }, [thumbnailPreviewUrl]);

  useEffect(() => {
    const loadColors = async () => {
      try {
        const response = await authFetch(`${API_BASE_URL}/api/admin/colors`);
        const result = await response.json();
        if (!response.ok || !result.ok || !Array.isArray(result.colors)) {
          return;
        }

        const parsed = result.colors
          .map((row: unknown) => {
            const color = row as Partial<AdminColor>;
            const colorId = Number(color.colorId);
            const name = String(color.name ?? '').trim();
            const code = String(color.code ?? '#dddddd').trim() || '#dddddd';
            if (!Number.isInteger(colorId) || colorId <= 0 || !name) return null;
            return { colorId, name, code };
          })
          .filter((row: AdminColor | null): row is AdminColor => Boolean(row));

        if (parsed.length > 0) {
          setAvailableColors(parsed);
        }
      } catch {
        // fallback colors
      }
    };

    loadColors();
  }, []);

  useEffect(() => {
    if (!isEditMode) return;

    const loadProductForEdit = async () => {
      setLoadingEditData(true);
      try {
        const response = await authFetch(`${API_BASE_URL}/api/admin/products/${productId}`);
        const result = await response.json();
        if (!response.ok || !result?.ok || !result?.product) {
          alert(result?.message ?? '상품 정보를 불러오지 못했습니다.');
          return;
        }

        const product = result.product as {
          name?: string;
          description?: string;
          price?: number;
          categoryId?: number;
          thumbnail?: string;
        };
        const options = (Array.isArray(result.productOptions) ? result.productOptions : []) as AdminProductOption[];

        setName(String(product.name ?? ''));
        setDescription(String(product.description ?? ''));
        setPrice(String(Number(product.price ?? 0)));
        setCategory(categoryFromId(Number(product.categoryId ?? 2)));

        const existingThumb = String(product.thumbnail ?? '').trim();
        setThumbnailPath(existingThumb);
        setThumbnailPreviewUrl(existingThumb);
        setThumbnailFile(null);

        const sizeSet = new Set<number>();
        const selectionMap: Record<number, number[]> = {};
        const stockTextMap: Record<string, string> = {};
        const stockNumMap: Record<string, number> = {};

        options.forEach((row) => {
          const sizeId = Number(row.sizeId);
          const colorId = Number(row.colorId);
          const stock = Number(row.stock ?? 0);
          if (!Number.isInteger(sizeId) || sizeId <= 0 || !Number.isInteger(colorId) || colorId <= 0) return;

          sizeSet.add(sizeId);
          selectionMap[sizeId] = selectionMap[sizeId] ?? [];
          if (!selectionMap[sizeId].includes(colorId)) {
            selectionMap[sizeId].push(colorId);
          }

          const key = `${sizeId}:${colorId}`;
          stockTextMap[key] = String(stock);
          stockNumMap[key] = stock;
        });

        const sizeIds = Array.from(sizeSet).sort((a, b) => a - b);
        setSelectedSizeIds(sizeIds);
        setActiveSizeId(sizeIds[0] ?? null);
        setSizeColorSelections(selectionMap);
        setOptionStocks(stockTextMap);
        setInitialOptionStocks(stockNumMap);
      } catch {
        alert('서버 연결에 실패했습니다.');
      } finally {
        setLoadingEditData(false);
      }
    };

    loadProductForEdit();
  }, [isEditMode, productId]);

  const selectedSizes = useMemo(
    () => AVAILABLE_SIZES.filter((size) => selectedSizeIds.includes(size.sizeId)),
    [selectedSizeIds]
  );
  const activeSize = useMemo(
    () => AVAILABLE_SIZES.find((size) => size.sizeId === activeSizeId) ?? null,
    [activeSizeId]
  );

  const selectedColors = useMemo(() => {
    const colorSet = new Set<number>();
    for (const sizeId of selectedSizeIds) {
      const ids = sizeColorSelections[sizeId] ?? [];
      ids.forEach((id) => colorSet.add(id));
    }
    return availableColors.filter((color) => colorSet.has(color.colorId));
  }, [availableColors, selectedSizeIds, sizeColorSelections]);

  const mainImage = thumbnailPreviewUrl || detailBlocks[0]?.previewUrl || '';
  const isRealImage = mainImage.length > 0;

  const handleSelectDetailImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    addDetailBlocks(files);
    e.target.value = '';
  };

  const handleSelectThumbnail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setThumbnailFile(file);
    setThumbnailPath('');
    if (thumbnailPreviewUrl) {
      URL.revokeObjectURL(thumbnailPreviewUrl);
      setThumbnailPreviewUrl('');
    }
    if (file) {
      setThumbnailPreviewUrl(URL.createObjectURL(file));
    }
  };

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(new Error('file read failed'));
      reader.readAsDataURL(file);
    });

  const optionKey = (sizeId: number, colorId: number) => `${sizeId}:${colorId}`;

  const handleToggleSize = (sizeId: number) => {
    setSelectedSizeIds((prev) => {
      if (prev.includes(sizeId)) {
        if (activeSizeId !== sizeId) {
          setActiveSizeId(sizeId);
          return prev;
        }

        const next = prev.filter((id) => id !== sizeId);
        setSizeColorSelections((selections) => {
          const copied = { ...selections };
          delete copied[sizeId];
          return copied;
        });
        setOptionStocks((stocks) => {
          const copied: Record<string, string> = {};
          Object.entries(stocks).forEach(([key, value]) => {
            if (!key.startsWith(`${sizeId}:`)) copied[key] = value;
          });
          return copied;
        });
        setActiveSizeId((curr) => {
          if (curr !== sizeId) return curr;
          return next.length > 0 ? next[next.length - 1] : null;
        });
        return next;
      }

      setSizeColorSelections((selections) => ({ ...selections, [sizeId]: selections[sizeId] ?? [] }));
      setActiveSizeId(sizeId);
      return [...prev, sizeId];
    });
  };

  const handleToggleSizeColor = (sizeId: number, colorId: number) => {
    setSizeColorSelections((prev) => {
      const current = prev[sizeId] ?? [];
      if (current.includes(colorId)) {
        const next = current.filter((id) => id !== colorId);
        setOptionStocks((stocks) => {
          const copied = { ...stocks };
          delete copied[optionKey(sizeId, colorId)];
          return copied;
        });
        return { ...prev, [sizeId]: next };
      }

      setOptionStocks((stocks) => ({
        ...stocks,
        [optionKey(sizeId, colorId)]: stocks[optionKey(sizeId, colorId)] ?? '',
      }));
      return { ...prev, [sizeId]: [...current, colorId] };
    });
  };

  const handleOptionStockChange = (sizeId: number, colorId: number, value: string) => {
    setOptionStocks((prev) => ({ ...prev, [optionKey(sizeId, colorId)]: value }));
  };

  const handleAddCustomColor = async () => {
    const code = customColorCode.trim();
    if (!/^#[0-9a-fA-F]{6}$/.test(code)) {
      alert('색상 코드를 확인해주세요.');
      return;
    }

    setCustomColorPending(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/admin/colors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          name: customColorName.trim(),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result?.ok || !result?.color) {
        alert(result?.message ?? '색상 추가에 실패했습니다.');
        return;
      }

      const color = result.color as Partial<AdminColor>;
      const colorId = Number(color.colorId);
      const name = String(color.name ?? '').trim();
      const savedCode = String(color.code ?? code).trim();
      if (!Number.isInteger(colorId) || colorId <= 0 || !name) {
        alert('색상 정보가 올바르지 않습니다.');
        return;
      }

      setAvailableColors((prev) => {
        const nextColor = { colorId, name, code: savedCode };
        const exists = prev.some((item) => item.colorId === colorId);
        if (exists) {
          return prev.map((item) => (item.colorId === colorId ? nextColor : item));
        }
        return [...prev, nextColor];
      });

      if (activeSizeId) {
        setSizeColorSelections((prev) => {
          const current = prev[activeSizeId] ?? [];
          if (current.includes(colorId)) return prev;
          return { ...prev, [activeSizeId]: [...current, colorId] };
        });
        setOptionStocks((prev) => ({
          ...prev,
          [optionKey(activeSizeId, colorId)]: prev[optionKey(activeSizeId, colorId)] ?? '',
        }));
      }

      setCustomColorName('');
    } catch {
      alert('서버 연결에 실패했습니다.');
    } finally {
      setCustomColorPending(false);
    }
  };

  const handleSubmit = async () => {
    const safeName = name.trim();
    const safeDescription = description.trim();
    const priceNum = Number(price);

    if (!safeName) {
      alert('상품명을 입력해주세요.');
      return;
    }
    if (!Number.isInteger(priceNum) || priceNum < 0) {
      alert('가격은 0 이상의 정수여야 합니다.');
      return;
    }
    if (selectedSizeIds.length === 0) {
      alert('사이즈를 하나 이상 선택해주세요.');
      return;
    }
    if (!thumbnailFile && !thumbnailPath) {
      alert('썸네일 이미지를 선택해주세요.');
      return;
    }

    for (const sizeId of selectedSizeIds) {
      const colorIds = sizeColorSelections[sizeId] ?? [];
      if (colorIds.length === 0) {
        const sizeLabel = AVAILABLE_SIZES.find((size) => size.sizeId === sizeId)?.label ?? String(sizeId);
        alert(`${sizeLabel} 사이즈에 색상을 하나 이상 선택해주세요.`);
        return;
      }

      for (const colorId of colorIds) {
        const key = optionKey(sizeId, colorId);
        const rawStock = String(optionStocks[key] ?? '').trim();
        if (rawStock.length === 0 && !isEditMode) {
          const sizeLabel = AVAILABLE_SIZES.find((size) => size.sizeId === sizeId)?.label ?? String(sizeId);
          const colorLabel = availableColors.find((color) => color.colorId === colorId)?.name ?? `색상-${colorId}`;
          alert(`${sizeLabel} / ${colorLabel} 재고를 입력해주세요.`);
          return;
        }
        if (rawStock.length === 0 && isEditMode) {
          continue;
        }
        const stockNum = Number(rawStock);
        if (!Number.isInteger(stockNum) || stockNum < 0) {
          alert('재고는 0 이상의 정수여야 합니다.');
          return;
        }
      }
    }

    const productOptions = selectedSizeIds.flatMap((sizeId) => {
      const colorIds = sizeColorSelections[sizeId] ?? [];
      return colorIds.map((colorId) => {
        const key = optionKey(sizeId, colorId);
        const rawStock = String(optionStocks[key] ?? '').trim();
        const stock = rawStock.length > 0 ? Number(rawStock) : (initialOptionStocks[key] ?? 0);
        return {
          colorId,
          sizeId,
          stock,
          additionalPrice: 0,
        };
      });
    });

    if (productOptions.length === 0) {
      alert('옵션을 선택해주세요.');
      return;
    }

    const colorStockMap: Record<number, number> = {};
    productOptions.forEach((option) => {
      colorStockMap[option.colorId] = (colorStockMap[option.colorId] ?? 0) + option.stock;
    });
    const productColors = Object.entries(colorStockMap).map(([colorId, stock]) => ({
      colorId: Number(colorId),
      stock,
    }));

    setSubmitting(true);
    try {
      const thumbnailDataUrl = thumbnailFile ? await fileToDataUrl(thumbnailFile) : '';
      const detailImageDataUrls = await Promise.all(detailBlocks.map((b) => fileToDataUrl(b.file)));
      const detailImageNames = detailBlocks.map((b) => b.file.name);
      const detailImageTexts = detailBlocks.map((b) => b.text);
      const endpoint = isEditMode
        ? `${API_BASE_URL}/api/admin/products/${productId}`
        : `${API_BASE_URL}/api/admin/products`;

      const response = await authFetch(endpoint, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: safeName,
          description: safeDescription,
          price: priceNum,
          category,
          status: 'ON_SALE',
          thumbnail: thumbnailPath,
          thumbnailDataUrl,
          thumbnailName: thumbnailFile?.name ?? '',
          detailImageDataUrls,
          detailImageNames,
          detailImageTexts,
          productColors,
          productOptions,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        alert(result.message ?? (isEditMode ? '상품 수정에 실패했습니다.' : '상품 등록에 실패했습니다.'));
        return;
      }

      if (isEditMode) {
        alert('상품이 수정되었습니다.');
        return;
      }

      alert(`상품이 등록되었습니다. (ID: ${result.productId})`);
      setName('');
      setPrice('');
      setDescription('');
      setThumbnailFile(null);
      setThumbnailPath('');
      if (thumbnailPreviewUrl) {
        URL.revokeObjectURL(thumbnailPreviewUrl);
      }
      setThumbnailPreviewUrl('');
      detailBlocks.forEach((b) => URL.revokeObjectURL(b.previewUrl));
      setDetailBlocks([]);
      setSelectedSizeIds([]);
      setActiveSizeId(null);
      setSizeColorSelections({});
      setOptionStocks({});
      setInitialOptionStocks({});
    } catch {
      alert('서버 연결에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Page>
      <Header>
        <PageTitle>{isEditMode ? '상품 수정' : '상품 업로드'}</PageTitle>
        <PageDesc>{isEditMode ? '등록된 상품 정보를 수정합니다.' : '상품 기본정보와 색상/재고를 등록합니다.'}</PageDesc>
      </Header>

      <Workspace>
        <EditorPanel>
          <Field>
            <Label htmlFor="product-name">상품명</Label>
            <Input
              id="product-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="상품명을 입력해주세요"
            />
          </Field>

          <Row>
            <Field>
              <Label htmlFor="product-category">카테고리</Label>
              <Select id="product-category" value={category} onChange={(e) => setCategory(e.target.value as CategoryType)}>
                <option value="outer">아우터</option>
                <option value="top">상의</option>
                <option value="bottom">하의</option>
                <option value="acc">악세서리</option>
              </Select>
            </Field>

            <Field>
              <Label htmlFor="product-price">가격 (원)</Label>
              <Input id="product-price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
            </Field>
          </Row>

          <Field>
            <Label htmlFor="product-description">한 줄 요약</Label>
            <TextArea
              id="product-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="상품 설명을 입력해주세요"
            />
          </Field>

          <Field>
            <Label htmlFor="product-thumbnail-file">썸네일</Label>
            <SmallUploadButton htmlFor="product-thumbnail-file">썸네일 불러오기</SmallUploadButton>
            <HiddenFileInput id="product-thumbnail-file" type="file" accept="image/*" onChange={handleSelectThumbnail} />
            <ThumbnailMeta>{thumbnailFile ? thumbnailFile.name : (thumbnailPath || '선택된 파일 없음')}</ThumbnailMeta>
          </Field>

          <Field>
            <Label>상세 이미지 (최대 10장)</Label>
            {detailBlocks.map((block, idx) => (
              <DetailBlockEditor key={idx}>
                <DetailBlockImageRow>
                  <DetailBlockThumb>
                    <img src={block.previewUrl} alt={`detail-${idx}`} />
                  </DetailBlockThumb>
                  <RemoveImageButton type="button" onClick={() => removeDetailBlock(idx)}>×</RemoveImageButton>
                </DetailBlockImageRow>
                <TextArea
                  rows={3}
                  value={block.text}
                  onChange={(e) => updateDetailBlockText(idx, e.target.value)}
                  placeholder="이미지 아래에 표시될 텍스트 (선택)"
                />
              </DetailBlockEditor>
            ))}
            {detailBlocks.length < 10 && (
              <>
                <UploadButton htmlFor="detail-images">
                  {detailBlocks.length === 0 ? '상세 이미지 추가' : '+ 이미지 추가'}
                </UploadButton>
                <HiddenFileInput id="detail-images" type="file" accept="image/*" multiple onChange={handleSelectDetailImages} />
              </>
            )}
            {detailBlocks.length > 0 && (
              <ThumbnailMeta>{detailBlocks.length}장 선택됨</ThumbnailMeta>
            )}
          </Field>

          <Field>
            <Label>사이즈 선택</Label>
            <SizeGrid>
              {AVAILABLE_SIZES.map((size) => (
                <SizeButton
                  key={size.sizeId}
                  type="button"
                  $selected={selectedSizeIds.includes(size.sizeId)}
                  onClick={() => handleToggleSize(size.sizeId)}
                >
                  {size.label}
                </SizeButton>
              ))}
            </SizeGrid>
          </Field>

          {activeSize && (
            <Field key={`color-${activeSize.sizeId}`}>
              <Label>{activeSize.label} 색상 선택</Label>
              <CustomColorRow>
                <ColorPickerInput
                  type="color"
                  value={customColorCode}
                  onChange={(e) => setCustomColorCode(e.target.value)}
                  aria-label="커스텀 색상 선택"
                  title={customColorCode.toUpperCase()}
                />
                <CustomColorTextInput
                  value={customColorName}
                  onChange={(e) => setCustomColorName(e.target.value)}
                  placeholder={`Custom ${customColorCode.toUpperCase()}`}
                  aria-label="커스텀 색상명"
                />
                <CustomColorButton type="button" onClick={handleAddCustomColor} disabled={customColorPending}>
                  {customColorPending ? '추가 중' : '색상 추가'}
                </CustomColorButton>
              </CustomColorRow>
              <ColorGrid>
                {availableColors.map((color) => (
                  <ColorButton
                    key={`${activeSize.sizeId}-${color.colorId}`}
                    type="button"
                    $colorCode={color.code}
                    $selected={(sizeColorSelections[activeSize.sizeId] ?? []).includes(color.colorId)}
                    onClick={() => handleToggleSizeColor(activeSize.sizeId, color.colorId)}
                    title={color.name}
                  />
                ))}
              </ColorGrid>
            </Field>
          )}

          {activeSize && (() => {
            const colorIds = sizeColorSelections[activeSize.sizeId] ?? [];
            const colors = availableColors.filter((color) => colorIds.includes(color.colorId));
            if (colors.length === 0) return null;
            return (
              <Field key={`stock-${activeSize.sizeId}`}>
                <Label>{activeSize.label} 색상별 재고</Label>
                <StockList>
                  {colors.map((color) => (
                    <StockRow key={`${activeSize.sizeId}-${color.colorId}`}>
                      <StockColor>
                        <Dot style={{ backgroundColor: color.code }} />
                        {color.name}
                      </StockColor>
                      <StockInput
                        type="number"
                        min={0}
                        value={optionStocks[optionKey(activeSize.sizeId, color.colorId)] ?? ''}
                        onChange={(e) => handleOptionStockChange(activeSize.sizeId, color.colorId, e.target.value)}
                      />
                    </StockRow>
                  ))}
                </StockList>
              </Field>
            );
          })()}

          {selectedColors.length > 0 && (
            <Field>
              <Label>선택된 색상 미리보기</Label>
              <StockList>
                {selectedColors.map((color) => (
                  <StockRow key={color.colorId}>
                    <StockColor>
                      <Dot style={{ backgroundColor: color.code }} />
                      {color.name}
                    </StockColor>
                  </StockRow>
                ))}
              </StockList>
            </Field>
          )}

          <SubmitButton type="button" onClick={handleSubmit} disabled={submitting || loadingEditData}>
            {loadingEditData ? '불러오는 중...' : (submitting ? (isEditMode ? '수정 중...' : '등록 중...') : (isEditMode ? '상품 수정' : '상품 등록'))}
          </SubmitButton>
        </EditorPanel>

        <PreviewPanel>
          <PreviewScroll>
            <Container>
              <ImageSection>
                <ImageWrapper>
                  {isRealImage ? (
                    <img src={mainImage} alt={name || 'preview'} />
                  ) : (
                    <ProductImageSVG type={category} />
                  )}
                </ImageWrapper>
                {detailBlocks.length > 0 && (
                  <PreviewDetailFlow>
                    {detailBlocks.map((block, idx) => (
                      <PreviewDetailBlock key={idx}>
                        <PreviewDetailThumb>
                          <img src={block.previewUrl} alt={`detail-${idx}`} />
                        </PreviewDetailThumb>
                        {block.text && <DetailTextPreview>{block.text}</DetailTextPreview>}
                      </PreviewDetailBlock>
                    ))}
                  </PreviewDetailFlow>
                )}
              </ImageSection>

              <InfoSection>
                <CategoryLabel>{category.toUpperCase()}</CategoryLabel>
                <ProductName>{name || '상품명을 입력해주세요'}</ProductName>
                <Price>₩{Number(price || 0).toLocaleString()}</Price>
                <Description>{description || '상품 요약을 입력해주세요.'}</Description>
                <Divider />
                <OptionLabel>Size</OptionLabel>
                <SizeGrid>
                  {selectedSizes.map((size) => (
                    <SizeButton key={`preview-size-${size.sizeId}`} type="button" $selected>
                      {size.label}
                    </SizeButton>
                  ))}
                </SizeGrid>
                <Divider />
                <OptionLabel>Color</OptionLabel>
                <ColorGrid>
                  {selectedColors.map((color) => (
                    <ColorButton key={`preview-${color.colorId}`} type="button" $colorCode={color.code} $selected title={color.name} />
                  ))}
                </ColorGrid>
              </InfoSection>
            </Container>
          </PreviewScroll>
        </PreviewPanel>
      </Workspace>
    </Page>
  );
};

export default ProductUpload;

const Page = styled.div`
  margin: -40px;
  padding: 24px;
  background: #f7f5f0;
  min-height: calc(100vh - 80px);
`;

const Header = styled.div`
  max-width: 1400px;
  margin: 0 auto 14px;
`;

const PageTitle = styled.h2`
  font-family: 'Playfair Display', 'Noto Sans KR', sans-serif;
  font-size: 21px;
  font-weight: 500;
  margin-bottom: 6px;
`;

const PageDesc = styled.p`
  font-size: 13px;
  color: #6f6f6f;

  @media (max-width: 768px) {
    text-align: center;
  }
`;

const Workspace = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 20px;

  @media (max-width: 1080px) {
    grid-template-columns: 1fr;
  }
`;

const EditorPanel = styled.aside`
  background: #fff;
  border: 1px solid #ece7de;
  padding: 20px;
  height: fit-content;
`;

const Field = styled.div`
  margin-bottom: 16px;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const Label = styled.label`
  display: block;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 6px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  font-size: 14px;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  resize: vertical;
  font-size: 13px;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d9d9d9;
  font-size: 14px;
`;

const UploadButton = styled.label`
  border: 1px solid #ddd;
  background: #fff;
  padding: 8px 10px;
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
`;

const SmallUploadButton = styled.label`
  border: 1px solid #ddd;
  background: #fff;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
  display: inline-flex;
`;

const ThumbnailMeta = styled.p`
  margin-top: 6px;
  font-size: 12px;
  color: #666;
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const CustomColorRow = styled.div`
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;

  @media (max-width: 520px) {
    grid-template-columns: 40px minmax(0, 1fr);
  }
`;

const ColorPickerInput = styled.input`
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid #d9d9d9;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  overflow: hidden;

  &::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  &::-webkit-color-swatch {
    border: 0;
    border-radius: 50%;
  }

  &::-moz-color-swatch {
    border: 0;
    border-radius: 50%;
  }
`;

const CustomColorTextInput = styled.input`
  width: 100%;
  min-width: 0;
  height: 36px;
  padding: 0 10px;
  border: 1px solid #d9d9d9;
  font-size: 13px;
`;

const CustomColorButton = styled.button`
  height: 36px;
  padding: 0 12px;
  border: 1px solid #222;
  background: #222;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;

  &:disabled {
    border-color: #bdbdbd;
    background: #bdbdbd;
    cursor: wait;
  }

  @media (max-width: 520px) {
    grid-column: 1 / -1;
  }
`;

const ColorGrid = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const SizeGrid = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const SizeButton = styled.button<{ $selected: boolean }>`
  min-width: 44px;
  height: 36px;
  border: 1px solid ${(props) => (props.$selected ? '#222' : '#d9d9d9')};
  background: ${(props) => (props.$selected ? '#222' : '#fff')};
  color: ${(props) => (props.$selected ? '#fff' : '#222')};
  font-size: 13px;
  cursor: pointer;
`;

const ColorButton = styled.button<{ $colorCode: string; $selected: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${(props) => props.$colorCode};
  border: 1px solid #ddd;
  cursor: pointer;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: -4px;
    left: -4px;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: 1px solid ${(props) => (props.$selected ? '#333' : 'transparent')};
  }
`;

const StockList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const StockRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
`;

const StockColor = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #333;
`;

const Dot = styled.span`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid #ddd;
`;

const StockInput = styled.input`
  width: 90px;
  padding: 6px 8px;
  border: 1px solid #d9d9d9;
  font-size: 13px;
`;

const SubmitButton = styled.button`
  width: 100%;
  border: none;
  background: #333;
  color: #fff;
  height: 46px;
  font-size: 14px;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const PreviewPanel = styled.section`
  background: #fff;
  border: 1px solid #ece7de;
`;

const PreviewScroll = styled.div`
  max-height: calc(100vh - 140px);
  overflow: auto;
`;

const Container = styled.div`
  padding: 64px 20px;
  display: flex;
  gap: 70px;

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 26px 14px 40px;
    gap: 26px;
  }
`;

const ImageSection = styled.div`
  flex: 1;
`;

const ImageWrapper = styled.div`
  width: 100%;
  aspect-ratio: 3 / 4;
  background-color: #f0f0f0;
  overflow: hidden;

  img,
  svg {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const InfoSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const CategoryLabel = styled.span`
  font-size: 14px;
  color: #888;
  letter-spacing: 1px;
  margin-bottom: 10px;
  text-transform: uppercase;
`;

const ProductName = styled.h1`
  font-size: 32px;
  font-weight: 400;
  margin-bottom: 20px;
  font-family: 'Playfair Display', serif;
  color: #1a1a1a;
`;

const Price = styled.p`
  font-size: 20px;
  font-weight: 500;
  color: #333;
  margin-bottom: 30px;
`;

const Description = styled.p`
  font-size: 15px;
  line-height: 1.8;
  color: #555;
  margin-bottom: 30px;
  white-space: pre-wrap;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid #e0e0e0;
  margin-bottom: 20px;
`;

const OptionLabel = styled.p`
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
`;

const DetailBlockEditor = styled.div`
  margin-top: 12px;
  border: 1px solid #e8e4dc;
  padding: 10px;
  background: #fafaf8;
`;

const DetailBlockImageRow = styled.div`
  position: relative;
  display: inline-block;
  margin-bottom: 8px;
`;

const DetailBlockThumb = styled.div`
  width: 80px;
  height: 80px;
  background: #f0f0f0;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  background: #333;
  color: #fff;
  border: none;
  border-radius: 50%;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
`;

const PreviewDetailFlow = styled.div`
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const PreviewDetailBlock = styled.div`
  display: flex;
  flex-direction: column;
`;

const PreviewDetailThumb = styled.div`
  width: 100%;
  background: #f0f0f0;
  overflow: hidden;

  img {
    width: 100%;
    height: auto;
    display: block;
    object-fit: contain;
  }
`;

const DetailTextPreview = styled.p`
  margin-top: 24px;
  font-size: 14px;
  line-height: 1.9;
  color: #444;
  white-space: pre-wrap;
`;
