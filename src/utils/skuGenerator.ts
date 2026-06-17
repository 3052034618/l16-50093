import type { AttributeDimension, Sku } from '@/types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

function cartesianProduct<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]];
  if (arrays.length === 1) return arrays[0].map((item) => [item]);

  const [first, ...rest] = arrays;
  const restProduct = cartesianProduct(rest);

  const result: T[][] = [];
  for (const item of first) {
    for (const combo of restProduct) {
      result.push([item, ...combo]);
    }
  }
  return result;
}

export function generateSkuCombinations(
  productId: string,
  dimensions: AttributeDimension[]
): Sku[] {
  const validDimensions = dimensions.filter((d) => d.values.length > 0);

  if (validDimensions.length === 0) {
    return [];
  }

  const dimensionIds = validDimensions.map((d) => d.id);
  const dimensionNames = validDimensions.map((d) => d.name);
  const valueArrays = validDimensions.map((d) => d.values);

  const valueCombinations = cartesianProduct(valueArrays);

  return valueCombinations.map((combination, index) => {
    const attributes: Record<string, string> = {};
    const attributeLabels: Record<string, string> = {};

    combination.forEach((value, dimIndex) => {
      attributes[dimensionIds[dimIndex]] = value.id;
      attributeLabels[dimensionNames[dimIndex]] = value.value;
    });

    const skuSuffix = String(index + 1).padStart(3, '0');

    return {
      id: generateId(),
      productId,
      skuCode: `SKU-${productId.slice(0, 4).toUpperCase()}-${skuSuffix}`,
      attributes,
      attributeLabels,
      salePrice: 0,
      costPrice: 0,
      stock: 0,
      imageUrl: combination[0]?.imageUrl,
    };
  });
}

export function generateSkuCode(productName: string, index: number): string {
  const prefix = productName.slice(0, 3).toUpperCase().replace(/\s/g, '');
  const suffix = String(index + 1).padStart(4, '0');
  return `${prefix}-${suffix}`;
}
