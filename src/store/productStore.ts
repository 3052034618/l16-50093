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

interface ProductState {
  products: Product[];
  dimensions: AttributeDimension[];
  skus: Sku[];
  stockFlows: StockFlow[];
  stockWarnings: StockWarning[];

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

export const useProductStore = create<ProductState>((set, get) => ({
  products: mockProducts,
  dimensions: mockDimensions,
  skus: mockSkus,
  stockFlows: mockStockFlows,
  stockWarnings: mockStockWarnings,

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
  },

  updateDimension: (dimensionId, name) => {
    set((state) => ({
      dimensions: state.dimensions.map((d) =>
        d.id === dimensionId ? { ...d, name } : d
      ),
    }));
  },

  deleteDimension: (dimensionId) => {
    set((state) => ({
      dimensions: state.dimensions.filter((d) => d.id !== dimensionId),
    }));
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
  },

  deleteAttributeValue: (valueId) => {
    set((state) => ({
      dimensions: state.dimensions.map((d) => ({
        ...d,
        values: d.values.filter((v) => v.id !== valueId),
      })),
    }));
  },

  regenerateSkus: (productId) => {
    const dimensions = get()
      .dimensions.filter((d) => d.productId === productId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const existingSkus = get().skus.filter((s) => s.productId === productId);
    const newSkus = generateSkuCombinations(productId, dimensions);

    const mergedSkus = newSkus.map((newSku) => {
      const existing = existingSkus.find((e) => {
        const keys = Object.keys(e.attributes);
        return keys.every(
          (k) => e.attributes[k] === newSku.attributes[k]
        );
      });
      if (existing) {
        return { ...existing, attributeLabels: newSku.attributeLabels };
      }
      return newSku;
    });

    set((state) => ({
      skus: [
        ...state.skus.filter((s) => s.productId !== productId),
        ...mergedSkus,
      ],
    }));
  },

  updateSku: (skuId, data) => {
    set((state) => ({
      skus: state.skus.map((s) =>
        s.id === skuId ? { ...s, ...data } : s
      ),
    }));
  },

  batchUpdateSkus: (skuIds, data) => {
    set((state) => ({
      skus: state.skus.map((s) =>
        skuIds.includes(s.id) ? { ...s, ...data } : s
      ),
    }));
  },

  saveProductSkus: (productId, operator) => {
    const skus = get().skus.filter((s) => s.productId === productId);
    const product = get().products.find((p) => p.id === productId);

    const newFlows: StockFlow[] = skus
      .filter((s) => s.stock > 0)
      .map((sku) => ({
        id: generateId(),
        skuId: sku.id,
        skuCode: sku.skuCode,
        productName: product?.name || '',
        type: 'adjust' as const,
        quantity: sku.stock,
        beforeStock: 0,
        afterStock: sku.stock,
        operator,
        remark: 'SKU库存初始化',
        createdAt: new Date().toISOString(),
      }));

    set((state) => ({
      stockFlows: [...newFlows, ...state.stockFlows],
    }));

    get().refreshWarnings();
  },

  getWarningLevel: (stock, threshold) => {
    const ratio = stock / threshold;
    if (ratio <= 0.3) return 'high';
    if (ratio <= 0.6) return 'medium';
    return 'low';
  },

  refreshWarnings: () => {
    const { products, skus, getWarningLevel } = get();
    const warnings: StockWarning[] = [];

    skus.forEach((sku) => {
      const product = products.find((p) => p.id === sku.productId);
      if (!product) return;

      const threshold = product.warningThreshold;
      if (sku.stock < threshold) {
        warnings.push({
          id: generateId(),
          skuId: sku.id,
          skuCode: sku.skuCode,
          productName: product.name,
          attributes: sku.attributeLabels,
          currentStock: sku.stock,
          threshold,
          level: getWarningLevel(sku.stock, threshold),
          resolved: false,
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
