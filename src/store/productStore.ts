import { create } from 'zustand';
import type {
  Product,
  AttributeDimension,
  Sku,
  StockFlow,
  StockWarning,
  WarningLevel,
} from '@/types';
import {
  mockProducts,
  mockDimensions,
  mockSkus,
  mockStockFlows,
  mockStockWarnings,
} from '@/utils/mockData';
import { generateSkuCombinations } from '@/utils/skuGenerator';

const STORAGE_KEY = 'sku-management-store';

interface SavedSkuSnapshot {
  id: string;
  stock: number;
}

interface ProductState {
  products: Product[];
  dimensions: AttributeDimension[];
  skus: Sku[];
  stockFlows: StockFlow[];
  stockWarnings: StockWarning[];
  savedSkuSnapshots: Record<string, SavedSkuSnapshot[]>;
  initialized: boolean;

  initializeStore: () => void;
  persistToStorage: () => void;

  getProductById: (id: string) => Product | undefined;
  getDimensionsByProductId: (productId: string) => AttributeDimension[];
  getSkusByProductId: (productId: string) => Sku[];

  addDimension: (productId: string, name: string) => void;
  updateDimension: (dimensionId: string, name: string) => void;
  deleteDimension: (dimensionId: string) => void;

  addAttributeValue: (
    dimensionId: string,
    value: string,
    colorHex?: string,
    imageUrl?: string
  ) => void;
  updateAttributeValue: (
    valueId: string,
    value: string,
    colorHex?: string,
    imageUrl?: string
  ) => void;
  deleteAttributeValue: (valueId: string) => void;

  regenerateSkus: (productId: string) => void;
  updateSku: (skuId: string, data: Partial<Sku>) => void;
  batchUpdateSkus: (skuIds: string[], data: Partial<Sku>) => void;
  batchGenerateSkuCodes: (skuIds: string[], prefix: string) => void;

  saveProductSkus: (productId: string, operator: string) => void;

  getWarningLevel: (stock: number, threshold: number) => WarningLevel;
  refreshWarnings: () => void;
  resolveWarning: (warningId: string) => void;

  getStockFlows: (filters?: {
    productId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
  }) => StockFlow[];
}

const generateId = () =>
  Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

function loadFromStorage(): Partial<ProductState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return {
      products: data.products || [],
      dimensions: data.dimensions || [],
      skus: data.skus || [],
      stockFlows: data.stockFlows || [],
      stockWarnings: data.stockWarnings || [],
      savedSkuSnapshots: data.savedSkuSnapshots || {},
    };
  } catch {
    return null;
  }
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  dimensions: [],
  skus: [],
  stockFlows: [],
  stockWarnings: [],
  savedSkuSnapshots: {},
  initialized: false,

  initializeStore: () => {
    if (get().initialized) return;
    const saved = loadFromStorage();
    if (saved && saved.products && saved.products.length > 0) {
      set({
        ...saved,
        initialized: true,
      });
    } else {
      set({
        products: mockProducts,
        dimensions: mockDimensions,
        skus: mockSkus,
        stockFlows: mockStockFlows,
        stockWarnings: mockStockWarnings,
        savedSkuSnapshots: {
          prod001: mockSkus
            .filter((s) => s.productId === 'prod001')
            .map((s) => ({ id: s.id, stock: s.stock })),
          prod002: mockSkus
            .filter((s) => s.productId === 'prod002')
            .map((s) => ({ id: s.id, stock: s.stock })),
          prod003: mockSkus
            .filter((s) => s.productId === 'prod003')
            .map((s) => ({ id: s.id, stock: s.stock })),
          prod004: mockSkus
            .filter((s) => s.productId === 'prod004')
            .map((s) => ({ id: s.id, stock: s.stock })),
        },
        initialized: true,
      });
      get().persistToStorage();
    }
  },

  persistToStorage: () => {
    try {
      const { products, dimensions, skus, stockFlows, stockWarnings, savedSkuSnapshots } = get();
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ products, dimensions, skus, stockFlows, stockWarnings, savedSkuSnapshots })
      );
    } catch {}
  },

  getProductById: (id) => {
    return get().products.find((p) => p.id === id);
  },

  getDimensionsByProductId: (productId) => {
    return get()
      .dimensions.filter((d) => d.productId === productId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },

  getSkusByProductId: (productId) => {
    return get().skus.filter((s) => s.productId === productId);
  },

  addDimension: (productId, name) => {
    const dimensions = get().dimensions;
    const productDimensions = dimensions.filter((d) => d.productId === productId);
    const newDimension: AttributeDimension = {
      id: generateId(),
      productId,
      name,
      sortOrder: productDimensions.length + 1,
      values: [],
    };
    set({ dimensions: [...dimensions, newDimension] });
    get().persistToStorage();
  },

  updateDimension: (dimensionId, name) => {
    set((state) => ({
      dimensions: state.dimensions.map((d) =>
        d.id === dimensionId ? { ...d, name } : d
      ),
    }));
    get().persistToStorage();
  },

  deleteDimension: (dimensionId) => {
    set((state) => ({
      dimensions: state.dimensions.filter((d) => d.id !== dimensionId),
    }));
    get().persistToStorage();
  },

  addAttributeValue: (dimensionId, value, colorHex, imageUrl) => {
    set((state) => ({
      dimensions: state.dimensions.map((d) => {
        if (d.id !== dimensionId) return d;
        return {
          ...d,
          values: [
            ...d.values,
            {
              id: generateId(),
              dimensionId,
              value,
              colorHex,
              imageUrl,
              sortOrder: d.values.length + 1,
            },
          ],
        };
      }),
    }));
    get().persistToStorage();
  },

  updateAttributeValue: (valueId, value, colorHex, imageUrl) => {
    set((state) => ({
      dimensions: state.dimensions.map((d) => ({
        ...d,
        values: d.values.map((v) =>
          v.id === valueId ? { ...v, value, colorHex, imageUrl } : v
        ),
      })),
    }));
    get().persistToStorage();
  },

  deleteAttributeValue: (valueId) => {
    set((state) => ({
      dimensions: state.dimensions.map((d) => ({
        ...d,
        values: d.values.filter((v) => v.id !== valueId),
      })),
    }));
    get().persistToStorage();
  },

  regenerateSkus: (productId) => {
    const dimensions = get()
      .dimensions.filter((d) => d.productId === productId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const existingSkus = get().skus.filter((s) => s.productId === productId);
    const newSkus = generateSkuCombinations(productId, dimensions);

    const mergedSkus = newSkus.map((newSku) => {
      const exactMatch = existingSkus.find((e) => {
        const allKeys = new Set([
          ...Object.keys(e.attributes),
          ...Object.keys(newSku.attributes),
        ]);
        return [...allKeys].every(
          (k) => e.attributes[k] === newSku.attributes[k]
        );
      });

      if (exactMatch) {
        return {
          ...exactMatch,
          attributeLabels: newSku.attributeLabels,
        };
      }

      const partialMatches = existingSkus.filter((e) => {
        const commonKeys = Object.keys(e.attributes).filter((k) =>
          k in newSku.attributes
        );
        if (commonKeys.length === 0) return false;
        return commonKeys.every((k) => e.attributes[k] === newSku.attributes[k]);
      });

      if (partialMatches.length > 0) {
        const best = partialMatches[0];
        return {
          ...newSku,
          salePrice: best.salePrice,
          costPrice: best.costPrice,
          skuCode: best.skuCode,
        };
      }

      return newSku;
    });

    set((state) => ({
      skus: [
        ...state.skus.filter((s) => s.productId !== productId),
        ...mergedSkus,
      ],
    }));
    get().persistToStorage();
  },

  updateSku: (skuId, data) => {
    set((state) => ({
      skus: state.skus.map((s) =>
        s.id === skuId ? { ...s, ...data } : s
      ),
    }));
    get().persistToStorage();
  },

  batchUpdateSkus: (skuIds, data) => {
    set((state) => ({
      skus: state.skus.map((s) =>
        skuIds.includes(s.id) ? { ...s, ...data } : s
      ),
    }));
    get().persistToStorage();
  },

  batchGenerateSkuCodes: (skuIds, prefix) => {
    const skus = get().skus;
    const updated = skus.map((s) => {
      if (!skuIds.includes(s.id)) return s;
      const idx = skuIds.indexOf(s.id) + 1;
      const suffix = String(idx).padStart(4, '0');
      return { ...s, skuCode: `${prefix}-${suffix}` };
    });
    set({ skus: updated });
    get().persistToStorage();
  },

  saveProductSkus: (productId, operator) => {
    const skus = get().skus.filter((s) => s.productId === productId);
    const product = get().products.find((p) => p.id === productId);
    const savedSnapshots = get().savedSkuSnapshots[productId] || [];

    const newFlows: StockFlow[] = [];

    skus.forEach((sku) => {
      const saved = savedSnapshots.find((s) => s.id === sku.id);
      const beforeStock = saved ? saved.stock : 0;

      if (sku.stock === beforeStock) return;

      const diff = sku.stock - beforeStock;
      let type: 'in' | 'out' | 'adjust';
      let remark: string;

      if (beforeStock === 0 && sku.stock > 0) {
        type = 'in';
        remark = 'SKU库存初始化';
      } else if (diff > 0) {
        type = 'in';
        remark = '库存增加';
      } else if (diff < 0) {
        type = 'out';
        remark = '库存减少';
      } else {
        type = 'adjust';
        remark = '库存调整';
      }

      newFlows.push({
        id: generateId(),
        skuId: sku.id,
        skuCode: sku.skuCode,
        productName: product?.name || '',
        type,
        quantity: diff,
        beforeStock,
        afterStock: sku.stock,
        operator,
        remark,
        createdAt: new Date().toISOString(),
      });
    });

    const newSnapshots = skus.map((s) => ({ id: s.id, stock: s.stock }));

    set((state) => ({
      stockFlows: [...newFlows, ...state.stockFlows],
      savedSkuSnapshots: {
        ...state.savedSkuSnapshots,
        [productId]: newSnapshots,
      },
    }));

    get().refreshWarnings();
    get().persistToStorage();

    if (newFlows.length > 0) {
      alert(`保存成功！已记录 ${newFlows.length} 条库存变动。`);
    } else {
      alert('保存成功！无库存变动。');
    }
  },

  getWarningLevel: (stock, threshold) => {
    const ratio = stock / threshold;
    if (ratio <= 0.3) return 'high';
    if (ratio <= 0.6) return 'medium';
    return 'low';
  },

  refreshWarnings: () => {
    const { products, skus, stockWarnings, getWarningLevel } = get();
    const resolvedMap = new Map<string, boolean>();
    stockWarnings.forEach((w) => {
      if (w.resolved) {
        resolvedMap.set(w.skuId, true);
      }
    });

    const warnings: StockWarning[] = [];

    skus.forEach((sku) => {
      const product = products.find((p) => p.id === sku.productId);
      if (!product) return;

      const threshold = product.warningThreshold;
      if (sku.stock < threshold) {
        const wasResolved = resolvedMap.get(sku.id) || false;
        warnings.push({
          id: generateId(),
          skuId: sku.id,
          skuCode: sku.skuCode,
          productName: product.name,
          attributes: sku.attributeLabels,
          currentStock: sku.stock,
          threshold,
          level: getWarningLevel(sku.stock, threshold),
          resolved: wasResolved,
          createdAt: new Date().toISOString(),
        });
      }
    });

    set({ stockWarnings: warnings });
  },

  resolveWarning: (warningId) => {
    set((state) => ({
      stockWarnings: state.stockWarnings.map((w) =>
        w.id === warningId ? { ...w, resolved: true } : w
      ),
    }));
    get().persistToStorage();
  },

  getStockFlows: (filters) => {
    let flows = [...get().stockFlows];

    if (filters?.productId) {
      const productSkus = get()
        .skus.filter((s) => s.productId === filters.productId)
        .map((s) => s.id);
      flows = flows.filter((f) => productSkus.includes(f.skuId));
    }

    if (filters?.type && filters.type !== 'all') {
      flows = flows.filter((f) => f.type === filters.type);
    }

    if (filters?.startDate) {
      flows = flows.filter(
        (f) => new Date(f.createdAt) >= new Date(filters.startDate!)
      );
    }

    if (filters?.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      flows = flows.filter((f) => new Date(f.createdAt) <= endDate);
    }

    return flows.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
}));
