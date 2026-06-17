export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  coverImage: string;
  warningThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface AttributeDimension {
  id: string;
  productId: string;
  name: string;
  sortOrder: number;
  values: AttributeValue[];
}

export interface AttributeValue {
  id: string;
  dimensionId: string;
  value: string;
  imageUrl?: string;
  colorHex?: string;
  sortOrder: number;
}

export interface Sku {
  id: string;
  productId: string;
  skuCode: string;
  attributes: Record<string, string>;
  attributeLabels: Record<string, string>;
  salePrice: number;
  costPrice: number;
  stock: number;
  imageUrl?: string;
}

export type StockFlowType = 'in' | 'out' | 'adjust';
export type StockAdjustReason =
  | 'purchase'
  | 'stocktake'
  | 'replenish'
  | 'damage'
  | 'return'
  | 'transfer'
  | 'other';

export interface StockFlow {
  id: string;
  skuId: string;
  skuCode: string;
  productName: string;
  type: StockFlowType;
  quantity: number;
  beforeStock: number;
  afterStock: number;
  operator: string;
  remark: string;
  createdAt: string;
  adjustReason?: StockAdjustReason;
  batchNo?: string;
}

export type WarningLevel = 'low' | 'medium' | 'high';

export interface StockWarning {
  id: string;
  skuId: string;
  skuCode: string;
  productName: string;
  attributes: Record<string, string>;
  currentStock: number;
  threshold: number;
  level: WarningLevel;
  resolved: boolean;
  createdAt: string;
}

export interface SkuEditData {
  salePrice?: number;
  costPrice?: number;
  stock?: number;
  skuCode?: string;
}

export interface BatchCodeOptions {
  prefix?: string;
  startNumber?: number;
  step?: number;
  padLength?: number;
  useAbbreviation?: boolean;
  separator?: string;
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
}
