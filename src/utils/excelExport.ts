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

export function downloadSkuTemplate(
  product: Product,
  dimensions: AttributeDimension[],
  skus: Sku[]
): void {
  const dimensionNames = dimensions.map((d) => d.name);
  const headers = ['商品编码', ...dimensionNames, '销售价格(元)', '成本价格(元)', '库存数量'];

  const sampleRows: Record<string, string | number>[] = [];
  const examples = skus.slice(0, 3);

  if (examples.length > 0) {
    examples.forEach((sku) => {
      const row: Record<string, string | number> = { 商品编码: sku.skuCode };
      dimensionNames.forEach((name) => {
        row[name] = sku.attributeLabels[name] || '';
      });
      row['销售价格(元)'] = sku.salePrice;
      row['成本价格(元)'] = sku.costPrice;
      row['库存数量'] = sku.stock;
      sampleRows.push(row);
    });
  } else {
    sampleRows.push({
      商品编码: '示例：TS-0001',
      [dimensionNames[0] || '规格1']: '示例：白色',
      [dimensionNames[1] || '规格2']: dimensionNames[1] ? '示例：M' : '',
      '销售价格(元)': 99,
      '成本价格(元)': 40,
      '库存数量': 100,
    });
  }

  const worksheet = XLSX.utils.json_to_sheet(sampleRows, { header: headers });
  worksheet['!cols'] = [
    { wch: 18 },
    ...dimensionNames.map(() => ({ wch: 12 })),
    { wch: 14 },
    { wch: 14 },
    { wch: 10 },
  ];

  const instruction: Record<string, string>[] = [
    { A: '导入说明：' },
    { A: '1. 请先在"商品编码"列填写已存在的SKU编码，或完整填写所有规格列用于匹配' },
    { A: '2. 商品编码优先于规格组合进行匹配' },
    { A: '3. 销售价格、成本价格、库存数量留空则表示不更新该字段' },
    { A: '4. 编码不可与其他SKU重复，同一导入文件内也不可重复' },
  ];
  const instructionSheet = XLSX.utils.json_to_sheet(instruction, {
    header: ['A'],
    skipHeader: true,
  });
  instructionSheet['!cols'] = [{ wch: 80 }];
  XLSX.utils.sheet_add_aoa(instructionSheet, [['导入说明']], { origin: 'A1' });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, instructionSheet, '导入说明');
  XLSX.utils.book_append_sheet(workbook, worksheet, 'SKU数据');

  const fileName = `${product.name}_SKU导入模板_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export async function parseSkusFromExcelFile(
  file: File
): Promise<Array<Record<string, any>>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: 'binary' });
        const sheetName =
          wb.SheetNames.find((n) => n.includes('SKU') || n.includes('数据')) ||
          wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        resolve(rows as Array<Record<string, any>>);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
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
    adjustReason?: string;
    batchNo?: string;
  }>
): void {
  const typeMap: Record<string, string> = {
    in: '入库',
    out: '出库',
    adjust: '调整',
  };
  const reasonMap: Record<string, string> = {
    purchase: '采购入库',
    stocktake: '盘点调整',
    replenish: '补货入库',
    damage: '报损出库',
    return: '退货入库',
    transfer: '调拨',
    other: '其他',
  };

  const data = flows.map((flow, index) => ({
    序号: index + 1,
    批次号: flow.batchNo || '',
    变动时间: new Date(flow.createdAt).toLocaleString('zh-CN'),
    商品名称: flow.productName,
    SKU编码: flow.skuCode,
    变动类型: typeMap[flow.type] || flow.type,
    调整原因: flow.adjustReason ? reasonMap[flow.adjustReason] || flow.adjustReason : '',
    变动数量: flow.quantity,
    变动前库存: flow.beforeStock,
    变动后库存: flow.afterStock,
    操作人: flow.operator,
    备注: flow.remark,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 20 },
    { wch: 20 },
    { wch: 16 },
    { wch: 10 },
    { wch: 12 },
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
