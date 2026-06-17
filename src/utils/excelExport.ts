import type { Sku, Product, AttributeDimension } from '@/types';
import * as XLSX from 'xlsx';

export function exportSkusToExcel(
  product: Product,
  skus: Sku[],
  dimensions: AttributeDimension[]
): void {
  const dimensionNames = dimensions.map((d) => d.name);

  const data = skus.map((sku, index) => {
    const row: Record<string, string | number> = {
      序号: index + 1,
      商品编码: sku.skuCode,
    };

    dimensionNames.forEach((dimName) => {
      row[dimName] = sku.attributeLabels[dimName] || '';
    });

    row['销售价格(元)'] = sku.salePrice;
    row['成本价格(元)'] = sku.costPrice;
    row['库存数量'] = sku.stock;
    row['库存金额(元)'] = sku.stock * sku.costPrice;

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(data);

  const colWidths = [
    { wch: 6 },
    { wch: 16 },
    ...dimensionNames.map(() => ({ wch: 12 })),
    { wch: 14 },
    { wch: 14 },
    { wch: 10 },
    { wch: 14 },
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'SKU列表');

  const summaryData = [
    { 统计项: 'SKU总数', 数值: skus.length },
    { 统计项: '总库存量', 数值: skus.reduce((sum, s) => sum + s.stock, 0) },
    {
      统计项: '库存总金额(元)',
      数值: skus.reduce((sum, s) => sum + s.stock * s.costPrice, 0),
    },
    {
      统计项: '平均售价(元)',
      数值:
        skus.length > 0
          ? Math.round((skus.reduce((sum, s) => sum + s.salePrice, 0) / skus.length) * 100) /
            100
          : 0,
    },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 16 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, '统计汇总');

  const fileName = `${product.name}_SKU列表_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function exportStockFlowToExcel(
  flows: Array<{
    id: string;
    skuCode: string;
    productName: string;
    type: string;
    quantity: number;
    beforeStock: number;
    afterStock: number;
    operator: string;
    remark: string;
    createdAt: string;
  }>
): void {
  const typeMap: Record<string, string> = {
    in: '入库',
    out: '出库',
    adjust: '调整',
  };

  const data = flows.map((flow, index) => ({
    序号: index + 1,
    变动时间: new Date(flow.createdAt).toLocaleString('zh-CN'),
    商品名称: flow.productName,
    SKU编码: flow.skuCode,
    变动类型: typeMap[flow.type] || flow.type,
    变动数量: flow.quantity,
    变动前库存: flow.beforeStock,
    变动后库存: flow.afterStock,
    操作人: flow.operator,
    备注: flow.remark,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 20 },
    { wch: 20 },
    { wch: 16 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 20 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '库存流水');

  const fileName = `库存流水_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
