import { useState, useMemo, useRef } from 'react';
import {
  CheckSquare,
  Square,
  Save,
  Edit3,
  TrendingUp,
  AlertTriangle,
  X,
  Hash,
  Download,
  Upload,
  Boxes,
  Plus,
  Minus,
  ClipboardList,
  PackageCheck,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import type { AttributeDimension, StockAdjustReason, BatchCodeOptions } from '@/types';
import { useProductStore } from '@/store/productStore';
import { cn } from '@/lib/utils';
import { exportSkusToExcel, downloadSkuTemplate, parseSkusFromExcelFile } from '@/utils/excelExport';

interface SkuTableProps {
  productId: string;
  dimensions: AttributeDimension[];
}

type AdjustMode = 'absolute' | 'increment';
type ImportStatus = { success: number; failed: number; errors: string[] };

const REASON_OPTIONS: { value: StockAdjustReason; label: string; type: 'in' | 'out' | 'adjust' }[] = [
  { value: 'stocktake', label: '盘点调整', type: 'adjust' },
  { value: 'replenish', label: '补货入库', type: 'in' },
  { value: 'damage', label: '报损出库', type: 'out' },
  { value: 'purchase', label: '采购入库', type: 'in' },
  { value: 'return', label: '退货入库', type: 'in' },
  { value: 'transfer', label: '调拨', type: 'adjust' },
  { value: 'other', label: '其他原因', type: 'adjust' },
];

export default function SkuTable({ productId, dimensions }: SkuTableProps) {
  const {
    getSkusByProductId,
    updateSku,
    batchUpdateSkus,
    batchGenerateSkuCodes,
    saveProductSkus,
    getWarningLevel,
    adjustStock,
    importSkus,
    planSkuCodes,
  } = useProductStore();

  const skus = getSkusByProductId(productId);
  const product = useProductStore((s) => s.products.find((p) => p.id === productId));

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedSkuIds, setSelectedSkuIds] = useState<string[]>([]);
  const [batchEditField, setBatchEditField] = useState<string | null>(null);
  const [batchValue, setBatchValue] = useState<string>('');
  const [editingCell, setEditingCell] = useState<{ skuId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const [showCodeGen, setShowCodeGen] = useState(false);
  const [codeOptions, setCodeOptions] = useState<BatchCodeOptions>({
    prefix: '',
    startNumber: 1,
    step: 1,
    padLength: 4,
    useAbbreviation: false,
    separator: '-',
  });

  const [showStockAdjust, setShowStockAdjust] = useState(false);
  const [adjustMode, setAdjustMode] = useState<AdjustMode>('increment');
  const [adjustReason, setAdjustReason] = useState<StockAdjustReason>('stocktake');
  const [adjustQuantity, setAdjustQuantity] = useState<string>('');
  const [adjustRemark, setAdjustRemark] = useState<string>('');

  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [codeDuplicates, setCodeDuplicates] = useState<string[] | null>(null);

  const allSelected = skus.length > 0 && selectedSkuIds.length === skus.length;
  const someSelected = selectedSkuIds.length > 0 && selectedSkuIds.length < skus.length;

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedSkuIds([]);
    } else {
      setSelectedSkuIds(skus.map((s) => s.id));
    }
  };

  const handleToggleSku = (skuId: string) => {
    setSelectedSkuIds((prev) =>
      prev.includes(skuId) ? prev.filter((id) => id !== skuId) : [...prev, skuId]
    );
  };

  const handleStartEdit = (skuId: string, field: string, value: number | string) => {
    setEditingCell({ skuId, field });
    setEditValue(String(value));
  };

  const handleSaveEdit = () => {
    if (!editingCell) return;

    const numValue = parseFloat(editValue);
    if (isNaN(numValue) && editingCell.field !== 'skuCode') {
      setEditingCell(null);
      return;
    }

    updateSku(editingCell.skuId, {
      [editingCell.field]: editingCell.field === 'skuCode' ? editValue : numValue,
    });

    setEditingCell(null);
  };

  const handleBatchApply = () => {
    if (!batchEditField || selectedSkuIds.length === 0) return;

    const numValue = parseFloat(batchValue);
    if (isNaN(numValue) && batchEditField !== 'skuCode') {
      setBatchEditField(null);
      return;
    }

    batchUpdateSkus(selectedSkuIds, {
      [batchEditField]: batchEditField === 'skuCode' ? batchValue : numValue,
    });

    setBatchEditField(null);
    setBatchValue('');
  };

  const handlePreviewCodes = () => {
    if (selectedSkuIds.length === 0) {
      setCodeDuplicates(null);
      return;
    }
    const result = planSkuCodes(selectedSkuIds, codeOptions);
    setCodeDuplicates(result.duplicates);
  };

  const handleBatchCodeGen = () => {
    if (selectedSkuIds.length === 0) return;
    if (!codeOptions.useAbbreviation && !codeOptions.prefix?.trim()) return;

    const result = batchGenerateSkuCodes(selectedSkuIds, codeOptions);
    if (result.duplicates.length > 0) {
      setCodeDuplicates(result.duplicates);
    } else {
      setCodeDuplicates(null);
    }
    setShowCodeGen(false);
  };

  const handleStockAdjust = () => {
    if (selectedSkuIds.length === 0 || !adjustQuantity) return;

    const qty = parseInt(adjustQuantity, 10);
    if (isNaN(qty)) return;

    const mode: 'absolute' | 'delta' = adjustMode === 'increment' ? 'delta' : 'absolute';
    const qtyFinal = qty;

    const result = adjustStock(
      productId,
      selectedSkuIds,
      mode,
      qtyFinal,
      adjustReason,
      adjustRemark,
      '管理员'
    );

    setSaveMessage({
      type: 'success',
      text: `已完成 ${result.successCount} 个SKU的库存调整，批次号：${result.batchNo}`,
    });
    setTimeout(() => setSaveMessage(null), 4000);

    setShowStockAdjust(false);
    setAdjustQuantity('');
    setAdjustRemark('');
    setSelectedSkuIds([]);
  };

  const handleSaveAll = () => {
    try {
      const result = saveProductSkus(productId, '管理员');
      if (result.success) {
        setSaveMessage({
          type: 'success',
          text: `保存成功！共更新 ${result.skuCount} 个SKU，记录 ${result.flowCount} 条库存流水`,
        });
      } else {
        setSaveMessage({ type: 'error', text: result.message || '保存失败' });
      }
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err?.message || '保存失败' });
      setTimeout(() => setSaveMessage(null), 4000);
    }
  };

  const handleDownloadTemplate = () => {
    if (!product) return;
    downloadSkuTemplate(product, dimensions, skus);
  };

  const handleExportExcel = () => {
    if (!product) return;
    exportSkusToExcel(product, skus, dimensions);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !product) return;

    setIsImporting(true);
    setImportStatus(null);
    try {
      const rows = await parseSkusFromExcelFile(file);
      const result = importSkus(productId, rows, dimensions, '管理员');
      setImportStatus({
        success: result.successCount,
        failed: result.failedRows.length,
        errors: result.failedRows.map((r) => `第${r.row}行：${r.reason}`),
      });
    } catch (err: any) {
      setImportStatus({ success: 0, failed: 0, errors: [err?.message || '文件解析失败'] });
    } finally {
      setIsImporting(false);
    }
  };

  const sortedDimensions = useMemo(
    () => [...dimensions].sort((a, b) => a.sortOrder - b.sortOrder),
    [dimensions]
  );

  const getStockWarningLevel = (stock: number) => {
    if (!product) return null;
    if (stock >= product.warningThreshold) return null;
    return getWarningLevel(stock, product.warningThreshold);
  };

  const totalStock = skus.reduce((sum, s) => sum + s.stock, 0);
  const totalValue = skus.reduce((sum, s) => sum + s.stock * s.costPrice, 0);
  const avgPrice =
    skus.length > 0
      ? Math.round((skus.reduce((sum, s) => sum + s.salePrice, 0) / skus.length) * 100) / 100
      : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-5 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">SKU 列表</h2>
            <p className="text-sm text-gray-500 mt-1">
              共 {skus.length} 个SKU · 总库存 {totalStock} 件 · 平均售价 ¥{avgPrice}
            </p>
          </div>

          {saveMessage && (
            <div
              className={cn(
                'fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-[slideIn_0.2s_ease-out]',
                saveMessage.type === 'success'
                  ? 'bg-green-600 text-white'
                  : 'bg-red-600 text-white'
              )}
            >
              {saveMessage.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">{saveMessage.text}</span>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {selectedSkuIds.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm">
                <span>已选 {selectedSkuIds.length} 项</span>
              </div>
            )}

            <select
              value={batchEditField || ''}
              onChange={(e) => {
                setBatchEditField(e.target.value || null);
                setBatchValue('');
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              disabled={selectedSkuIds.length === 0}
            >
              <option value="">批量设置...</option>
              <option value="salePrice">批量设置售价</option>
              <option value="costPrice">批量设置成本价</option>
              <option value="stock">批量设置库存</option>
            </select>

            {batchEditField && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={batchEditField === 'skuCode' ? '输入编码前缀' : '输入数值'}
                  value={batchValue}
                  onChange={(e) => setBatchValue(e.target.value)}
                  className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button
                  onClick={handleBatchApply}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  应用
                </button>
                <button
                  onClick={() => {
                    setBatchEditField(null);
                    setBatchValue('');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              onClick={() => setShowStockAdjust(!showStockAdjust)}
              disabled={selectedSkuIds.length === 0}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                selectedSkuIds.length === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : showStockAdjust
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
              )}
            >
              <ClipboardList className="w-4 h-4" />
              库存调整
            </button>

            <button
              onClick={() => setShowCodeGen(!showCodeGen)}
              disabled={selectedSkuIds.length === 0}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                selectedSkuIds.length === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : showCodeGen
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              )}
            >
              <Hash className="w-4 h-4" />
              批量编码
            </button>

            <div className="h-8 w-px bg-gray-200 mx-1" />

            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              <Download className="w-4 h-4" />
              模板
            </button>

            <button
              onClick={handleImportClick}
              disabled={isImporting}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors disabled:opacity-50"
            >
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              导入
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors"
            >
              <Boxes className="w-4 h-4" />
              导出
            </button>

            <button
              onClick={handleSaveAll}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              保存所有
            </button>
          </div>
        </div>

        {importStatus && (
          <div
            className={cn(
              'mt-4 p-4 rounded-xl border',
              importStatus.failed > 0
                ? 'bg-amber-50 border-amber-200'
                : 'bg-green-50 border-green-200'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    成功 {importStatus.success} 行
                  </span>
                </div>
                {importStatus.failed > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-medium text-amber-700">
                      失败 {importStatus.failed} 行
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setImportStatus(null)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {importStatus.errors.length > 0 && (
              <div className="mt-3 max-h-32 overflow-y-auto">
                {importStatus.errors.map((err, i) => (
                  <p key={i} className="text-xs text-amber-700 leading-relaxed">
                    · {err}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {showStockAdjust && selectedSkuIds.length > 0 && (
          <div className="mt-4 p-4 bg-orange-50 rounded-xl border border-orange-200">
            <div className="flex items-center gap-3 mb-3">
              <ClipboardList className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">库存调整</span>
              <span className="text-xs text-orange-500">
                将为选中的 {selectedSkuIds.length} 个SKU生成库存流水
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setAdjustMode('increment')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
                    adjustMode === 'increment'
                      ? 'bg-orange-600 text-white border-orange-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                  )}
                >
                  <Plus className="w-4 h-4" /> 增减量
                </button>
                <button
                  onClick={() => setAdjustMode('absolute')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
                    adjustMode === 'absolute'
                      ? 'bg-orange-600 text-white border-orange-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                  )}
                >
                  <Minus className="w-4 h-4" /> 设为值
                </button>
              </div>
              <input
                type="number"
                placeholder={adjustMode === 'increment' ? '增量，正增负减' : '目标库存'}
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(e.target.value)}
                className="px-3 py-2 border border-orange-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
              />
              <select
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value as StockAdjustReason)}
                className="px-3 py-2 border border-orange-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
              >
                {REASON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="备注（选填）"
                value={adjustRemark}
                onChange={(e) => setAdjustRemark(e.target.value)}
                className="px-3 py-2 border border-orange-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleStockAdjust}
                  disabled={!adjustQuantity}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    adjustQuantity
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  )}
                >
                  确认调整
                </button>
                <button
                  onClick={() => {
                    setShowStockAdjust(false);
                    setAdjustQuantity('');
                    setAdjustRemark('');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {showCodeGen && selectedSkuIds.length > 0 && (
          <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
            <div className="flex items-center gap-3">
              <Hash className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">批量生成SKU编码</span>
              <span className="text-xs text-purple-500">
                将为选中的 {selectedSkuIds.length} 个SKU生成编码
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 mt-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-purple-600 font-medium">前缀</label>
                <input
                  type="text"
                  placeholder="如：TS、SH"
                  value={codeOptions.prefix || ''}
                  onChange={(e) =>
                    setCodeOptions((o) => ({ ...o, prefix: e.target.value.toUpperCase() }))
                  }
                  className="px-3 py-2 border border-purple-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer mt-5">
                <input
                  type="checkbox"
                  checked={codeOptions.useAbbreviation}
                  onChange={(e) =>
                    setCodeOptions((o) => ({ ...o, useAbbreviation: e.target.checked }))
                  }
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-purple-700 font-medium">规格缩写拼接</span>
              </label>

              {!codeOptions.useAbbreviation && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-purple-600 font-medium">起始编号</label>
                    <input
                      type="number"
                      min={0}
                      value={codeOptions.startNumber ?? 1}
                      onChange={(e) =>
                        setCodeOptions((o) => ({
                          ...o,
                          startNumber: parseInt(e.target.value || '1', 10),
                        }))
                      }
                      className="px-3 py-2 border border-purple-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-purple-600 font-medium">步长</label>
                    <input
                      type="number"
                      min={1}
                      value={codeOptions.step ?? 1}
                      onChange={(e) =>
                        setCodeOptions((o) => ({
                          ...o,
                          step: parseInt(e.target.value || '1', 10),
                        }))
                      }
                      className="px-3 py-2 border border-purple-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-purple-600 font-medium">补零长度</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={codeOptions.padLength ?? 4}
                      onChange={(e) =>
                        setCodeOptions((o) => ({
                          ...o,
                          padLength: parseInt(e.target.value || '4', 10),
                        }))
                      }
                      className="px-3 py-2 border border-purple-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white"
                    />
                  </div>
                </>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs text-purple-600 font-medium">分隔符</label>
                <input
                  type="text"
                  placeholder="-"
                  maxLength={2}
                  value={codeOptions.separator ?? '-'}
                  onChange={(e) =>
                    setCodeOptions((o) => ({ ...o, separator: e.target.value }))
                  }
                  className="px-3 py-2 border border-purple-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-white text-center"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-sm text-purple-700">
                预览格式：
                <span className="font-mono font-medium ml-1">
                  {codeOptions.useAbbreviation
                    ? `${codeOptions.prefix ? codeOptions.prefix + (codeOptions.separator || '') : ''}BAI${codeOptions.separator || '-'}M`
                    : `${codeOptions.prefix || 'XXX'}${codeOptions.separator || '-'}${String(codeOptions.startNumber ?? 1).padStart(codeOptions.padLength ?? 4, '0')}`}
                </span>
              </span>
              <button
                onClick={handlePreviewCodes}
                className="px-3 py-1.5 bg-white text-purple-700 border border-purple-300 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors"
              >
                检测重复
              </button>
              {codeDuplicates !== null && (
                codeDuplicates.length > 0 ? (
                  <span className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="w-3.5 h-3.5" />
                    检测到 {codeDuplicates.length} 个重复编码，请调整参数或手动修改
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <PackageCheck className="w-3.5 h-3.5" />
                    未检测到重复编码，可以生成
                  </span>
                )
              )}
              <div className="flex-1" />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBatchCodeGen}
                  disabled={
                    (!codeOptions.useAbbreviation && !codeOptions.prefix?.trim()) ||
                    (codeDuplicates !== null && codeDuplicates.length > 0)
                  }
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    (!codeOptions.useAbbreviation && !codeOptions.prefix?.trim()) ||
                    (codeDuplicates !== null && codeDuplicates.length > 0)
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  )}
                >
                  生成编码
                </button>
                <button
                  onClick={() => {
                    setShowCodeGen(false);
                    setCodeDuplicates(null);
                    setCodeOptions({
                      prefix: '',
                      startNumber: 1,
                      step: 1,
                      padLength: 4,
                      useAbbreviation: false,
                      separator: '-',
                    });
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-12 px-4 py-3 text-left">
                <button
                  onClick={handleToggleAll}
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                >
                  {allSelected ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : someSelected ? (
                    <CheckSquare className="w-5 h-5 text-blue-400 opacity-60" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                SKU编码
              </th>
              {sortedDimensions.map((dim) => (
                <th
                  key={dim.id}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                >
                  {dim.name}
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                销售价格
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                成本价格
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                库存数量
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                状态
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {skus.length === 0 ? (
              <tr>
                <td
                  colSpan={sortedDimensions.length + 5}
                  className="px-4 py-16 text-center text-gray-500"
                >
                  <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>暂无SKU数据</p>
                  <p className="text-sm text-gray-400 mt-1">请先配置属性维度和属性值</p>
                </td>
              </tr>
            ) : (
              skus.map((sku, index) => {
                const warningLevel = getStockWarningLevel(sku.stock);

                return (
                  <tr
                    key={sku.id}
                    className={cn(
                      'hover:bg-blue-50/50 transition-colors',
                      selectedSkuIds.includes(sku.id) && 'bg-blue-50/70',
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                    )}
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleSku(sku.id)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        {selectedSkuIds.includes(sku.id) ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    </td>

                    <td className="px-4 py-3">
                      {editingCell?.skuId === sku.id && editingCell?.field === 'skuCode' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleSaveEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          className="w-full px-2 py-1 border border-blue-400 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <div
                          className="flex items-center gap-2 cursor-pointer group"
                          onClick={() => handleStartEdit(sku.id, 'skuCode', sku.skuCode)}
                        >
                          <span className="text-sm font-mono text-gray-700">{sku.skuCode}</span>
                          <Edit3 className="w-3 h-3 text-gray-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </td>

                    {sortedDimensions.map((dim) => {
                      const attrValue = dim.values.find((v) => v.id === sku.attributes[dim.id]);

                      return (
                        <td key={dim.id} className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {attrValue?.imageUrl ? (
                              <img
                                src={attrValue.imageUrl}
                                alt={attrValue.value}
                                className="w-6 h-6 rounded object-cover border border-gray-200"
                              />
                            ) : attrValue?.colorHex ? (
                              <div
                                className="w-5 h-5 rounded-full border-2 border-white shadow"
                                style={{ backgroundColor: attrValue.colorHex }}
                              />
                            ) : null}
                            <span className="text-sm text-gray-700">{attrValue?.value || '-'}</span>
                          </div>
                        </td>
                      );
                    })}

                    <td className="px-4 py-3 text-right">
                      {editingCell?.skuId === sku.id && editingCell?.field === 'salePrice' ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleSaveEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          className="w-24 px-2 py-1 border border-blue-400 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <div
                          className="flex items-center justify-end gap-1 cursor-pointer group"
                          onClick={() => handleStartEdit(sku.id, 'salePrice', sku.salePrice)}
                        >
                          <span className="text-sm font-semibold text-blue-600">
                            ¥{sku.salePrice.toFixed(2)}
                          </span>
                          <Edit3 className="w-3 h-3 text-gray-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {editingCell?.skuId === sku.id && editingCell?.field === 'costPrice' ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleSaveEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          className="w-24 px-2 py-1 border border-blue-400 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <div
                          className="flex items-center justify-end gap-1 cursor-pointer group"
                          onClick={() => handleStartEdit(sku.id, 'costPrice', sku.costPrice)}
                        >
                          <span className="text-sm text-gray-600">¥{sku.costPrice.toFixed(2)}</span>
                          <Edit3 className="w-3 h-3 text-gray-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {editingCell?.skuId === sku.id && editingCell?.field === 'stock' ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleSaveEdit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          className="w-20 px-2 py-1 border border-blue-400 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <div
                          className="flex items-center justify-end gap-1 cursor-pointer group"
                          onClick={() => handleStartEdit(sku.id, 'stock', sku.stock)}
                        >
                          <span
                            className={cn(
                              'text-sm font-medium',
                              warningLevel === 'high' && 'text-red-600',
                              warningLevel === 'medium' && 'text-amber-600',
                              warningLevel === 'low' && 'text-yellow-600',
                              !warningLevel && 'text-gray-700'
                            )}
                          >
                            {sku.stock}
                          </span>
                          <Edit3 className="w-3 h-3 text-gray-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {warningLevel ? (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                            warningLevel === 'high' && 'bg-red-100 text-red-700',
                            warningLevel === 'medium' && 'bg-amber-100 text-amber-700',
                            warningLevel === 'low' && 'bg-yellow-100 text-yellow-700'
                          )}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          库存预警
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          正常
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {skus.length > 0 && (
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            共 <span className="font-medium text-gray-700">{skus.length}</span> 个SKU · 总库存{' '}
            <span className="font-medium text-gray-700">{totalStock}</span> 件 · 库存总价值{' '}
            <span className="font-medium text-gray-700">¥{totalValue.toLocaleString()}</span>
          </div>
          <div className="text-sm text-gray-400">
            点击单元格可直接编辑 · 支持批量操作和编码生成
          </div>
        </div>
      )}
    </div>
  );
}
