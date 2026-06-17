import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Image, Palette } from 'lucide-react';
import type { AttributeDimension, AttributeValue } from '@/types';
import { useProductStore } from '@/store/productStore';
import { cn } from '@/lib/utils';

interface AttributeConfigProps {
  productId: string;
}

export default function AttributeConfig({ productId }: AttributeConfigProps) {
  const {
    getDimensionsByProductId,
    addDimension,
    updateDimension,
    deleteDimension,
    addAttributeValue,
    updateAttributeValue,
    deleteAttributeValue,
    regenerateSkus,
  } = useProductStore();

  const dimensions = getDimensionsByProductId(productId);

  const [newDimName, setNewDimName] = useState('');
  const [showAddDim, setShowAddDim] = useState(false);
  const [editingDimId, setEditingDimId] = useState<string | null>(null);
  const [editingDimName, setEditingDimName] = useState('');

  const [editingValueId, setEditingValueId] = useState<string | null>(null);
  const [newValueName, setNewValueName] = useState('');
  const [newValueColor, setNewValueColor] = useState('#1e40af');
  const [addingValueDimId, setAddingValueDimId] = useState<string | null>(null);

  const handleAddDimension = () => {
    if (!newDimName.trim()) return;
    addDimension(productId, newDimName.trim());
    setNewDimName('');
    setShowAddDim(false);
    regenerateSkus(productId);
  };

  const handleUpdateDimension = (dimId: string) => {
    if (!editingDimName.trim()) return;
    updateDimension(dimId, editingDimName.trim());
    setEditingDimId(null);
    regenerateSkus(productId);
  };

  const handleDeleteDimension = (dimId: string) => {
    if (confirm('确定要删除该属性维度吗？删除后相关SKU也会变化。')) {
      deleteDimension(dimId);
      regenerateSkus(productId);
    }
  };

  const handleAddValue = (dimId: string) => {
    if (!newValueName.trim()) return;
    addAttributeValue(dimId, newValueName.trim(), newValueColor);
    setNewValueName('');
    setAddingValueDimId(null);
    regenerateSkus(productId);
  };

  const handleUpdateValue = (valueId: string, dimId: string) => {
    const dim = dimensions.find((d) => d.id === dimId);
    const value = dim?.values.find((v) => v.id === valueId);
    if (value) {
      updateAttributeValue(valueId, value.value, value.colorHex, value.imageUrl);
      setEditingValueId(null);
      regenerateSkus(productId);
    }
  };

  const handleDeleteValue = (valueId: string) => {
    if (confirm('确定要删除该属性值吗？')) {
      deleteAttributeValue(valueId);
      regenerateSkus(productId);
    }
  };

  const handleColorChange = (valueId: string, dimId: string, color: string) => {
    const dim = dimensions.find((d) => d.id === dimId);
    const value = dim?.values.find((v) => v.id === valueId);
    if (value) {
      updateAttributeValue(valueId, value.value, color, value.imageUrl);
      regenerateSkus(productId);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">属性维度配置</h2>
          <p className="text-sm text-gray-500 mt-1">
            配置商品的属性维度，系统将自动生成所有SKU组合
          </p>
        </div>
        <button
          onClick={() => setShowAddDim(!showAddDim)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加属性维度
        </button>
      </div>

      {showAddDim && (
        <div className="p-4 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="输入属性维度名称，如：颜色、尺码、材质"
              value={newDimName}
              onChange={(e) => setNewDimName(e.target.value)}
              className="flex-1 px-4 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAddDimension()}
              autoFocus
            />
            <button
              onClick={handleAddDimension}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              确认添加
            </button>
            <button
              onClick={() => {
                setShowAddDim(false);
                setNewDimName('');
              }}
              className="px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="p-5">
        {dimensions.length === 0 ? (
          <div className="py-12 text-center">
            <Palette className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">还没有配置任何属性维度</p>
            <p className="text-sm text-gray-400">
              点击上方按钮添加第一个属性维度
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {dimensions.map((dim) => (
              <div
                key={dim.id}
                className="border border-gray-200 rounded-xl overflow-hidden hover:border-blue-200 transition-colors"
              >
                <div className="bg-gradient-to-r from-gray-50 to-white px-4 py-3 flex items-center justify-between border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    {editingDimId === dim.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingDimName}
                          onChange={(e) => setEditingDimName(e.target.value)}
                          className="px-2 py-1 border border-blue-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateDimension(dim.id);
                            if (e.key === 'Escape') setEditingDimId(null);
                          }}
                        />
                        <button
                          onClick={() => handleUpdateDimension(dim.id)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingDimId(null)}
                          className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <h3 className="font-medium text-gray-800">{dim.name}</h3>
                    )}
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {dim.values.length} 个属性值
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {editingDimId !== dim.id && (
                      <button
                        onClick={() => {
                          setEditingDimId(dim.id);
                          setEditingDimName(dim.name);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="编辑维度名称"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteDimension(dim.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="删除维度"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex flex-wrap gap-3 mb-4">
                    {dim.values.map((value) => (
                      <div
                        key={value.id}
                        className={cn(
                          'group relative flex items-center gap-2 px-3 py-2 border rounded-lg transition-all',
                          editingValueId === value.id
                            ? 'border-blue-400 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                        )}
                      >
                        {value.colorHex && (
                          <div
                            className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                            style={{ backgroundColor: value.colorHex }}
                          />
                        )}
                        <span className="text-sm text-gray-700">{value.value}</span>

                        <div className="absolute -top-2 -right-2 hidden group-hover:flex items-center gap-0.5 bg-white border border-gray-200 rounded-full shadow-md p-0.5">
                          <label className="cursor-pointer p-1 text-gray-500 hover:text-blue-600">
                            <input
                              type="color"
                              value={value.colorHex || '#ffffff'}
                              onChange={(e) =>
                                handleColorChange(value.id, dim.id, e.target.value)
                              }
                              className="w-0 h-0 opacity-0 absolute"
                            />
                            <Palette className="w-3 h-3" />
                          </label>
                          <button
                            onClick={() => setEditingValueId(value.id)}
                            className="p-1 text-gray-500 hover:text-blue-600"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteValue(value.id)}
                            className="p-1 text-gray-500 hover:text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {addingValueDimId === dim.id ? (
                      <div className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
                        <input
                          type="text"
                          placeholder="属性值名称"
                          value={newValueName}
                          onChange={(e) => setNewValueName(e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddValue(dim.id);
                          }}
                        />
                        <input
                          type="color"
                          value={newValueColor}
                          onChange={(e) => setNewValueColor(e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer border-0"
                        />
                        <button
                          onClick={() => handleAddValue(dim.id)}
                          className="p-1 text-green-600 hover:bg-green-100 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setAddingValueDimId(null);
                            setNewValueName('');
                          }}
                          className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setAddingValueDimId(dim.id);
                          setNewValueName('');
                        }}
                        className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm">添加属性值</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {dimensions.length > 0 && (
          <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">
              <span className="font-medium">提示：</span>
              当前配置了 {dimensions.length} 个属性维度，
              共 {dimensions.reduce((acc, d) => acc * (d.values.length || 1), 1)} 个SKU组合。
              所有修改会实时更新下方SKU表格。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
