import { useState, useMemo } from 'react';
import {
  CheckSquare,
  Square,
  Download,
  Save,
  Edit3,
  TrendingUp,
  AlertTriangle,
  X,
} from 'lucide-react';
import type { Sku, AttributeDimension } from '@/types';
import { useProductStore } from '@/store/productStore';
import { cn } from '@/lib/utils';

interface SkuTableProps {
  productId: string;
  dimensions: AttributeDimension[];
}

export default function SkuTable({ productId, dimensions }: SkuTableProps) {
  const {
    getSkusByProductId,
    updateSku,
    batchUpdateSkus,
    saveProductSkus,
    getWarningLevel,
  } = useProductStore();

  const skus = getSkusByProductId(productId);
  const product = useProductStore((s) => s.products.find((p) => p.id === productId));

  const [selectedSkuIds, setSelectedSkuIds] = useState<string[]>([]);
  const [batchEditField, setBatchEditField] = useState<string | null>(null);
  const [batchValue, setBatchValue] = useState<string>('');
  const [editingCell, setEditingCell] = useState<{ skuId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

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
      [editingCell.field]:
        editingCell.field === 'skuCode' ? editValue : numValue,
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

  const handleSaveAll = () => {
    saveProductSkus(productId, '管理员');
    alert('保存成功！库存变动记录已生成。');
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
  const avgPrice = skus.length > 0
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
                  placeholder={
                    batchEditField === 'skuCode' ? '输入编码前缀' : '输入数值'
                  }
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
              onClick={handleSaveAll}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              保存所有
            </button>
          </div>
        </div>
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
                  <p className="text-sm text-gray-400 mt-1">
                    请先配置属性维度和属性值
                  </p>
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
                      {editingCell?.skuId === sku.id &&
                      editingCell?.field === 'skuCode' ? (
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
                          <span className="text-sm font-mono text-gray-700">
                            {sku.skuCode}
                          </span>
                          <Edit3 className="w-3 h-3 text-gray-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </td>

                    {sortedDimensions.map((dim) => {
                      const attrValue = dim.values.find(
                        (v) => v.id === sku.attributes[dim.id]
                      );

                      return (
                        <td key={dim.id} className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {attrValue?.colorHex && (
                              <div
                                className="w-5 h-5 rounded-full border-2 border-white shadow"
                                style={{ backgroundColor: attrValue.colorHex }}
                              />
                            )}
                            <span className="text-sm text-gray-700">
                              {attrValue?.value || '-'}
                            </span>
                          </div>
                        </td>
                      );
                    })}

                    <td className="px-4 py-3 text-right">
                      {editingCell?.skuId === sku.id &&
                      editingCell?.field === 'salePrice' ? (
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
                          onClick={() =>
                            handleStartEdit(sku.id, 'salePrice', sku.salePrice)
                          }
                        >
                          <span className="text-sm font-semibold text-blue-600">
                            ¥{sku.salePrice.toFixed(2)}
                          </span>
                          <Edit3 className="w-3 h-3 text-gray-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {editingCell?.skuId === sku.id &&
                      editingCell?.field === 'costPrice' ? (
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
                          onClick={() =>
                            handleStartEdit(sku.id, 'costPrice', sku.costPrice)
                          }
                        >
                          <span className="text-sm text-gray-600">
                            ¥{sku.costPrice.toFixed(2)}
                          </span>
                          <Edit3 className="w-3 h-3 text-gray-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {editingCell?.skuId === sku.id &&
                      editingCell?.field === 'stock' ? (
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
                            warningLevel === 'high' &&
                              'bg-red-100 text-red-700',
                            warningLevel === 'medium' &&
                              'bg-amber-100 text-amber-700',
                            warningLevel === 'low' &&
                              'bg-yellow-100 text-yellow-700'
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
            共 <span className="font-medium text-gray-700">{skus.length}</span> 个SKU ·
            总库存 <span className="font-medium text-gray-700">{totalStock}</span> 件 ·
            库存总价值 <span className="font-medium text-gray-700">¥{totalValue.toLocaleString()}</span>
          </div>
          <div className="text-sm text-gray-400">
            点击单元格可直接编辑 · 支持批量操作
          </div>
        </div>
      )}
    </div>
  );
}
