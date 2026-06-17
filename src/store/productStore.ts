import { create } from 'zustand';
import type {
  Product,
  AttributeDimension,
  Sku,
  StockFlow,
  StockWarning,
  WarningLevel,
  StockAdjustReason,
  BatchCodeOptions,
} from '@/types';
import {
  mockProducts,
  mockDimensions,
  mockSkus,
  mockStockFlows,
  mockStockWarnings,
} from '@/utils/mockData';
import { generateSkuCombinations } from '@/utils/skuGenerator';

const STORAGE_KEY = 'sku-management-store-v2';

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
  updateSku: (skuId: string, data: Partial<Sku>) => boolean;
  batchUpdateSkus: (skuIds: string[], data: Partial<Sku>) => boolean;
  batchGenerateSkuCodes: (
    skuIds: string[],
    options: BatchCodeOptions
  ) => { duplicates: string[]; generated: number };
  checkDuplicateSkuCodes: (
    skuIds: string[],
    codes: string[]
  ) => string[];
  planSkuCodes: (
    skuIds: string[],
    options: BatchCodeOptions
  ) => { codes: string[]; duplicates: string[] };

  saveProductSkus: (
    productId: string,
    operator: string
  ) => { success: boolean; skuCount: number; flowCount: number; message?: string };

  adjustStock: (
    productId: string,
    skuIds: string[],
    mode: 'absolute' | 'delta',
    quantity: number,
    reason: StockAdjustReason,
    remark: string,
    operator: string
  ) => { successCount: number; batchNo: string };

  importSkus: (
    productId: string,
    rows: Array<Record<string, any>>,
    dimensions?: AttributeDimension[],
    operator?: string
  ) => { successCount: number; failedRows: Array<{ row: number; reason: string }> };

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

const generateBatchNo = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `BATCH${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
};

const REASON_LABEL: Record<StockAdjustReason, string> = {
  purchase: '采购入库',
  stocktake: '盘点调整',
  replenish: '补货入库',
  damage: '报损出库',
  return: '退货入库',
  transfer: '调拨',
  other: '其他',
};

const getAbbreviation = (str: string, len = 2): string => {
  if (!str) return '';
  const cleaned = str.replace(/\s+/g, '');
  if (cleaned.length <= len) return cleaned.toUpperCase();
  return cleaned.slice(0, len).toUpperCase();
};

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
      const {
        products,
        dimensions,
        skus,
        stockFlows,
        stockWarnings,
        savedSkuSnapshots,
      } = get();
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          products,
          dimensions,
          skus,
          stockFlows,
          stockWarnings,
          savedSkuSnapshots,
        })
      );
    } catch {}
  },

  getProductById: (id) => get().products.find((p) => p.id === id),
  getDimensionsByProductId: (productId) =>
    get()
      .dimensions.filter((d) => d.productId === productId)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  getSkusByProductId: (productId) =>
    get().skus.filter((s) => s.productId === productId),

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
    const allDimensions = get()
      .dimensions.filter((d) => d.productId === productId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const existingSkus = get().skus.filter((s) => s.productId === productId);
    const newSkus = generateSkuCombinations(productId, allDimensions);

    const existingDimIds = new Set(
      existingSkus.flatMap((s) => Object.keys(s.attributes))
    );
    const newDimIds = new Set(
      newSkus.flatMap((s) => Object.keys(s.attributes))
    );
    const commonDimIds = [...existingDimIds].filter((id) => newDimIds.has(id));
    const addedDimIds = [...newDimIds].filter((id) => !existingDimIds.has(id));

    // 构建每个新组合的唯一 key
    const buildKey = (attrs: Record<string, string>, dims: string[]) =>
      dims.map((d) => attrs[d] || '').join('||');
    const allDimIdsSorted = allDimensions.map((d) => d.id);

    if (existingSkus.length === 0 || addedDimIds.length === 0) {
      // 无历史数据或只是老维度内部删改值 → 精确匹配
      const existingMap = new Map(
        existingSkus.map((s) => [buildKey(s.attributes, allDimIdsSorted), s])
      );
      const mergedSkus = newSkus.map((newSku) => {
        const key = buildKey(newSku.attributes, allDimIdsSorted);
        const exact = existingMap.get(key);
        if (exact) {
          return { ...exact, attributeLabels: newSku.attributeLabels };
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
      return;
    }

    // ============== 有新增维度的场景：一一对应继承 ==============
    // 1. 对每个新增维度，选出"默认值"（sortOrder 第一个 value）
    const addedDimDefaultValue: Record<string, string> = {};
    addedDimIds.forEach((dimId) => {
      const dim = allDimensions.find((d) => d.id === dimId);
      const firstValue = [...(dim?.values || [])].sort(
        (a, b) => a.sortOrder - b.sortOrder
      )[0];
      if (firstValue) addedDimDefaultValue[dimId] = firstValue.id;
    });

    // 2. 为每个旧 SKU 计算它在新世界里唯一对应的目标组合：
    //    旧属性值 拼上 每个新增维度的默认值
    const oldSkuById = new Map(existingSkus.map((s) => [s.id, s]));
    const oldSkuTargetKey = new Map<string, string>(); // oldSkuId → target combination key
    const targetKeyToOldSkuId = new Map<string, string>(); // target key → oldSkuId

    existingSkus.forEach((sku) => {
      const mergedAttrs: Record<string, string> = { ...sku.attributes };
      addedDimIds.forEach((dimId) => {
        mergedAttrs[dimId] = addedDimDefaultValue[dimId] || '';
      });
      const targetKey = buildKey(mergedAttrs, allDimIdsSorted);
      oldSkuTargetKey.set(sku.id, targetKey);
      if (!targetKeyToOldSkuId.has(targetKey)) {
        targetKeyToOldSkuId.set(targetKey, sku.id);
      }
    });

    // 3. 构造精确匹配 Map（处理无新增维度但属性有改动的极端情况）
    const exactMap = new Map(
      existingSkus.map((s) => [buildKey(s.attributes, allDimIdsSorted), s])
    );

    // 4. 遍历新组合，一一匹配
    const usedOldSkuIds = new Set<string>();
    const mergedSkus = newSkus.map((newSku) => {
      const key = buildKey(newSku.attributes, allDimIdsSorted);

      // a) 精确匹配（老维度没变、没改值的场景）
      if (exactMap.has(key)) {
        usedOldSkuIds.add(exactMap.get(key)!.id);
        return { ...exactMap.get(key)!, attributeLabels: newSku.attributeLabels };
      }

      // b) 这个新组合恰好是某个旧 SKU 映射过来的唯一目标组合
      const matchedOldId = targetKeyToOldSkuId.get(key);
      if (matchedOldId && !usedOldSkuIds.has(matchedOldId)) {
        const oldSku = oldSkuById.get(matchedOldId)!;
        usedOldSkuIds.add(matchedOldId);
        return {
          ...newSku,
          salePrice: oldSku.salePrice,
          costPrice: oldSku.costPrice,
          stock: oldSku.stock,
          skuCode: oldSku.skuCode,
        };
      }

      // c) 完全是新组合（比如新增维度上取了非默认值）→ 使用默认库存初始化
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
    const state = get();
    if (data.skuCode !== undefined) {
      const otherSame = state.skus.find(
        (s) => s.id !== skuId && s.skuCode === data.skuCode
      );
      if (otherSame) return false;
    }
    set({
      skus: state.skus.map((s) => (s.id === skuId ? { ...s, ...data } : s)),
    });
    get().persistToStorage();
    return true;
  },

  batchUpdateSkus: (skuIds, data) => {
    const state = get();
    if (data.skuCode !== undefined) {
      const conflicts = state.skus.filter(
        (s) => !skuIds.includes(s.id) && s.skuCode === data.skuCode
      );
      if (conflicts.length > 0 || skuIds.length > 1) return false;
    }
    set({
      skus: state.skus.map((s) =>
        skuIds.includes(s.id) ? { ...s, ...data } : s
      ),
    });
    get().persistToStorage();
    return true;
  },

  checkDuplicateSkuCodes: (skuIds, codes) => {
    const state = get();
    const codeSet = new Map<string, string[]>();
    codes.forEach((c, i) => {
      const id = skuIds[i] || `_new_${i}`;
      if (!codeSet.has(c)) codeSet.set(c, []);
      codeSet.get(c)!.push(id);
    });
    const duplicates: string[] = [];
    for (const [code, ids] of codeSet.entries()) {
      if (ids.length > 1) {
        duplicates.push(`编码 ${code} 将被 ${ids.length} 个SKU重复使用`);
      }
      const external = state.skus.find(
        (s) => s.skuCode === code && !skuIds.includes(s.id)
      );
      if (external) {
        duplicates.push(`编码 ${code} 已被其他SKU使用`);
      }
    }
    return duplicates;
  },

  planSkuCodes: (skuIds, options) => {
    const state = get();
    const {
      prefix = '',
      startNumber = 1,
      step = 1,
      padLength = 4,
      useAbbreviation = false,
      separator = '-',
    } = options;

    const dimensions = state.dimensions;
    const plannedCodes: string[] = [];

    skuIds.forEach((skuId, idx) => {
      const sku = state.skus.find((s) => s.id === skuId);
      if (!sku) {
        plannedCodes.push('');
        return;
      }
      let code = '';
      if (prefix) code += prefix;
      if (useAbbreviation) {
        const dims = dimensions.filter((d) => d.productId === sku.productId);
        const abbrs = dims
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((d) => {
            const valId = sku.attributes[d.id];
            const val = d.values.find((v) => v.id === valId);
            return getAbbreviation(val?.value || '', 1);
          })
          .filter(Boolean);
        if (abbrs.length > 0) {
          if (code) code += separator;
          code += abbrs.join(separator);
        }
      }
      const seq = startNumber + idx * step;
      const seqStr = String(seq).padStart(Math.max(1, padLength), '0');
      if (code) code += separator;
      code += seqStr;
      plannedCodes.push(code.toUpperCase());
    });

    const duplicates = get().checkDuplicateSkuCodes(skuIds, plannedCodes);
    return { codes: plannedCodes, duplicates };
  },

  batchGenerateSkuCodes: (skuIds, options) => {
    const state = get();

    const { codes: plannedCodes, duplicates } = get().planSkuCodes(skuIds, options);
    if (duplicates.length > 0) {
      return { duplicates, generated: 0 };
    }

    const updated = state.skus.map((s) => {
      const idx = skuIds.indexOf(s.id);
      if (idx < 0) return s;
      return { ...s, skuCode: plannedCodes[idx] };
    });

    set({ skus: updated });
    get().persistToStorage();
    return { duplicates: [], generated: skuIds.length };
  },

  saveProductSkus: (productId, operator) => {
    const state = get();
    const skus = state.skus.filter((s) => s.productId === productId);
    const product = state.products.find((p) => p.id === productId);
    const savedSnapshots = state.savedSkuSnapshots[productId] || [];

    const codeCount = new Map<string, number>();
    skus.forEach((s) => codeCount.set(s.skuCode, (codeCount.get(s.skuCode) || 0) + 1));
    const dupCodes = [...codeCount.entries()]
      .filter(([, c]) => c > 1)
      .map(([k]) => k);
    if (dupCodes.length > 0) {
      return {
        success: false,
        skuCount: skus.length,
        flowCount: 0,
        message: `存在重复的SKU编码 (${dupCodes.join(', ')})，请先调整后再保存。`,
      };
    }

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

    set((s) => ({
      stockFlows: [...newFlows, ...s.stockFlows],
      savedSkuSnapshots: {
        ...s.savedSkuSnapshots,
        [productId]: newSnapshots,
      },
    }));
    get().refreshWarnings();
    get().persistToStorage();

    return { success: true, skuCount: skus.length, flowCount: newFlows.length };
  },

  adjustStock: (
    productId,
    skuIds,
    mode,
    quantity,
    reason,
    remark,
    operator
  ) => {
    const state = get();
    const product = state.products.find((p) => p.id === productId);
    const batchNo = generateBatchNo();
    const reasonLabel = REASON_LABEL[reason] || reason;
    const newFlows: StockFlow[] = [];

    const updated = state.skus.map((s) => {
      if (!skuIds.includes(s.id)) return s;
      const beforeStock = s.stock;
      let afterStock: number;
      let qty: number;
      if (mode === 'absolute') {
        afterStock = Math.max(0, quantity);
        qty = afterStock - beforeStock;
      } else {
        qty = quantity;
        afterStock = Math.max(0, beforeStock + quantity);
        qty = afterStock - beforeStock;
      }
      if (qty !== 0 || mode === 'absolute') {
        const flowType: 'in' | 'out' | 'adjust' =
          qty > 0 ? 'in' : qty < 0 ? 'out' : 'adjust';
        newFlows.push({
          id: generateId(),
          skuId: s.id,
          skuCode: s.skuCode,
          productName: product?.name || '',
          type: flowType,
          quantity: qty,
          beforeStock,
          afterStock,
          operator,
          remark: remark || reasonLabel,
          createdAt: new Date().toISOString(),
          adjustReason: reason,
          batchNo,
        });
      }
      return { ...s, stock: afterStock };
    });

    const savedSnapshots = state.savedSkuSnapshots[productId] || [];
    const snapshotMap = new Map(savedSnapshots.map((s) => [s.id, s.stock]));
    updated
      .filter((s) => s.productId === productId)
      .forEach((s) => snapshotMap.set(s.id, s.stock));
    const newSnapshots = [...snapshotMap.entries()].map(([id, stock]) => ({
      id,
      stock,
    }));

    set({
      skus: updated,
      stockFlows: [...newFlows, ...state.stockFlows],
      savedSkuSnapshots: {
        ...state.savedSkuSnapshots,
        [productId]: newSnapshots,
      },
    });
    get().refreshWarnings();
    get().persistToStorage();

    return { successCount: newFlows.length, batchNo };
  },

  importSkus: (productId, rows, _dimensions, operator = '导入') => {
    const state = get();
    const product = state.products.find((p) => p.id === productId);
    const dims = state.dimensions.filter((d) => d.productId === productId);
    const productSkus = state.skus.filter((s) => s.productId === productId);
    const errors: Array<{ row: number; reason: string }> = [];
    const updates: Array<{ skuId: string; data: Partial<Sku> }> = [];
    const usedCodes = new Set<string>();

    rows.forEach((raw, i) => {
      const rowIndex = i + 2;
      const row: Record<string, any> = {};
      Object.keys(raw).forEach((k) => {
        row[String(k).trim()] = raw[k];
      });

      let matchedSku: Sku | undefined;
      const code = String(row['商品编码'] || row['skuCode'] || row['SKU编码'] || '').trim();

      if (code) {
        matchedSku = productSkus.find((s) => s.skuCode === code);
      }

      if (!matchedSku) {
        const attrMatch: Record<string, string> = {};
        dims.forEach((d) => {
          const val = String(row[d.name] || '').trim();
          if (val) {
            const found = d.values.find(
              (v) => v.value === val || v.id === val
            );
            if (found) attrMatch[d.id] = found.id;
          }
        });
        if (Object.keys(attrMatch).length > 0) {
          matchedSku = productSkus.find((s) =>
            Object.entries(attrMatch).every(
              ([k, v]) => s.attributes[k] === v
            )
          );
        }
      }

      if (!matchedSku) {
        errors.push({
          row: rowIndex,
          reason: code
            ? `未找到编码为 "${code}" 的SKU，且规格组合也无法匹配`
            : '无法通过规格组合匹配到SKU，请填写商品编码或完整规格',
        });
        return;
      }

      const patch: Partial<Sku> = {};
      if (row['销售价格(元)'] !== undefined && row['销售价格(元)'] !== '') {
        const n = Number(row['销售价格(元)']);
        if (isNaN(n)) {
          errors.push({ row: rowIndex, reason: '销售价格格式错误' });
          return;
        }
        patch.salePrice = n;
      }
      if (row['成本价格(元)'] !== undefined && row['成本价格(元)'] !== '') {
        const n = Number(row['成本价格(元)']);
        if (isNaN(n)) {
          errors.push({ row: rowIndex, reason: '成本价格格式错误' });
          return;
        }
        patch.costPrice = n;
      }
      if (row['库存数量'] !== undefined && row['库存数量'] !== '') {
        const n = Number(row['库存数量']);
        if (isNaN(n) || n < 0) {
          errors.push({ row: rowIndex, reason: '库存数量格式错误' });
          return;
        }
        patch.stock = n;
      }
      if (code) {
        if (usedCodes.has(code)) {
          errors.push({
            row: rowIndex,
            reason: `编码 "${code}" 在导入文件中重复`,
          });
          return;
        }
        usedCodes.add(code);
        const conflict = productSkus.find(
          (s) => s.id !== matchedSku!.id && s.skuCode === code
        );
        if (conflict) {
          errors.push({
            row: rowIndex,
            reason: `编码 "${code}" 已被其他SKU使用`,
          });
          return;
        }
        patch.skuCode = code;
      }

      if (Object.keys(patch).length === 0) {
        errors.push({ row: rowIndex, reason: '未提供任何可更新字段' });
        return;
      }

      updates.push({ skuId: matchedSku.id, data: patch });
    });

    if (updates.length > 0) {
      const updatedSkus = state.skus.map((s) => {
        const up = updates.find((u) => u.skuId === s.id);
        return up ? { ...s, ...up.data } : s;
      });

      const savedSnapshots = state.savedSkuSnapshots[productId] || [];
      const snapshotMap = new Map(savedSnapshots.map((s) => [s.id, s.stock]));
      const newFlows: StockFlow[] = [];

      updates.forEach(({ skuId, data }) => {
        if (data.stock === undefined) return;
        const skuBefore = state.skus.find((s) => s.id === skuId);
        if (!skuBefore) return;
        const beforeStock = snapshotMap.get(skuId) ?? skuBefore.stock;
        const afterStock = data.stock;
        if (afterStock === beforeStock) return;
        newFlows.push({
          id: generateId(),
          skuId,
          skuCode: (data.skuCode as string) || skuBefore.skuCode,
          productName: product?.name || '',
          type: afterStock > beforeStock ? 'in' : 'out',
          quantity: afterStock - beforeStock,
          beforeStock,
          afterStock,
          operator,
          remark: 'Excel批量导入更新',
          createdAt: new Date().toISOString(),
          adjustReason: 'other',
        });
      });

      updatedSkus
        .filter((s) => s.productId === productId)
        .forEach((s) => snapshotMap.set(s.id, s.stock));
      const newSnapshots = [...snapshotMap.entries()].map(([id, stock]) => ({
        id,
        stock,
      }));

      set({
        skus: updatedSkus,
        stockFlows: [...newFlows, ...state.stockFlows],
        savedSkuSnapshots: {
          ...state.savedSkuSnapshots,
          [productId]: newSnapshots,
        },
      });
      get().refreshWarnings();
      get().persistToStorage();
    }

    return {
      successCount: updates.length,
      failedRows: errors,
    };
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
      if (w.resolved) resolvedMap.set(w.skuId, true);
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
