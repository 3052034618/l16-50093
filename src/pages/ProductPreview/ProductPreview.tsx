import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Heart,
  Share2,
  ChevronLeft,
  Minus,
  Plus,
  Truck,
  Shield,
  RotateCcw,
  Star,
  Package,
  Check,
} from 'lucide-react';
import { useProductStore } from '@/store/productStore';
import { cn } from '@/lib/utils';

export default function ProductPreview() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as { productId?: string };
  const productId = state?.productId || 'prod001';

  const {
    getProductById,
    getDimensionsByProductId,
    getSkusByProductId,
  } = useProductStore();

  const product = getProductById(productId);
  const dimensions = getDimensionsByProductId(productId).sort(
    (a, b) => a.sortOrder - b.sortOrder
  );
  const skus = getSkusByProductId(productId);

  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string>
  >({});
  const [quantity, setQuantity] = useState(1);

  const selectedSku = useMemo(() => {
    return skus.find((sku) => {
      return Object.entries(selectedAttributes).every(
        ([dimId, valId]) => sku.attributes[dimId] === valId
      );
    });
  }, [skus, selectedAttributes]);

  const priceRange = useMemo(() => {
    if (skus.length === 0) return { min: 0, max: 0 };
    const prices = skus.map((s) => s.salePrice);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [skus]);

  const totalStock = useMemo(
    () => skus.reduce((sum, s) => sum + s.stock, 0),
    [skus]
  );

  const handleSelectAttribute = (dimId: string, valueId: string) => {
    setSelectedAttributes((prev) => {
      if (prev[dimId] === valueId) {
        const { [dimId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [dimId]: valueId };
    });
  };

  const allSelected = dimensions.every(
    (dim) => selectedAttributes[dim.id] !== undefined
  );

  const isValueAvailable = (dimId: string, valueId: string) => {
    const testAttrs = { ...selectedAttributes, [dimId]: valueId };
    return skus.some((sku) =>
      Object.entries(testAttrs).every(
        ([key, val]) => sku.attributes[key] === val
      )
    );
  };

  const handleAddToCart = () => {
    if (!allSelected || !selectedSku) {
      alert('请选择完整的规格');
      return;
    }
    if (selectedSku.stock < quantity) {
      alert('库存不足');
      return;
    }
    alert(`已添加 ${quantity} 件商品到购物车`);
  };

  const handleBuyNow = () => {
    if (!allSelected || !selectedSku) {
      alert('请选择完整的规格');
      return;
    }
    if (selectedSku.stock < quantity) {
      alert('库存不足');
      return;
    }
    alert('立即购买成功！');
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">商品不存在</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>返回</span>
          </button>
          <h1 className="text-lg font-semibold text-gray-800">商品详情</h1>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Heart className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 p-8 flex items-center justify-center min-h-[500px]">
              <div className="relative w-full max-w-md aspect-square">
                <img
                  src={product.coverImage}
                  alt={product.name}
                  className="w-full h-full object-contain drop-shadow-2xl"
                />
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <button
                      key={i}
                      className={cn(
                        'w-2 h-2 rounded-full transition-all',
                        i === 0
                          ? 'bg-blue-600 w-6'
                          : 'bg-gray-300 hover:bg-gray-400'
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-full mb-3">
                  热销爆款
                </span>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h2>
                <p className="text-gray-500">{product.description}</p>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        'w-4 h-4',
                        star <= 4
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      )}
                    />
                  ))}
                  <span className="text-sm text-gray-500 ml-1">4.8</span>
                </div>
                <span className="text-sm text-gray-400">|</span>
                <span className="text-sm text-gray-500">2,345 评价</span>
                <span className="text-sm text-gray-400">|</span>
                <span className="text-sm text-gray-500">月销 1,200+</span>
              </div>

              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-gray-500">¥</span>
                  <span className="text-4xl font-bold text-red-600">
                    {selectedSku
                      ? selectedSku.salePrice.toFixed(2)
                      : priceRange.min === priceRange.max
                      ? priceRange.min.toFixed(2)
                      : `${priceRange.min.toFixed(2)} - ${priceRange.max.toFixed(2)}`}
                  </span>
                  {!selectedSku && priceRange.min !== priceRange.max && (
                    <span className="text-sm text-gray-500">起</span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="text-gray-500">
                    库存:{' '}
                    <span className="text-gray-700 font-medium">
                      {selectedSku ? selectedSku.stock : totalStock} 件
                    </span>
                  </span>
                  {selectedSku && (
                    <span className="text-gray-500">
                      商品编码:{' '}
                      <span className="font-mono text-gray-700">
                        {selectedSku.skuCode}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {dimensions.map((dim) => (
                  <div key={dim.id}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-800">
                        {dim.name}
                      </h3>
                      {selectedAttributes[dim.id] && (
                        <span className="text-xs text-gray-500">
                          已选:{' '}
                          {
                            dim.values.find(
                              (v) => v.id === selectedAttributes[dim.id]
                            )?.value
                          }
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {dim.values.map((value) => {
                        const isSelected =
                          selectedAttributes[dim.id] === value.id;
                        const available = isValueAvailable(dim.id, value.id);

                        return (
                          <button
                            key={value.id}
                            onClick={() =>
                              available && handleSelectAttribute(dim.id, value.id)
                            }
                            disabled={!available}
                            className={cn(
                              'relative group flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all duration-200',
                              isSelected &&
                                'border-blue-600 bg-blue-50 shadow-md scale-105',
                              !isSelected &&
                                available &&
                                'border-gray-200 hover:border-blue-400 hover:shadow-sm bg-white',
                              !available &&
                                'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                            )}
                          >
                            {value.imageUrl ? (
                              <img
                                src={value.imageUrl}
                                alt={value.value}
                                className={cn(
                                  'w-7 h-7 rounded-lg object-cover border transition-all',
                                  isSelected
                                    ? 'border-blue-600 scale-110 ring-2 ring-blue-200'
                                    : 'border-gray-200'
                                )}
                              />
                            ) : value.colorHex ? (
                              <div
                                className={cn(
                                  'w-6 h-6 rounded-full border-2 transition-all',
                                  isSelected
                                    ? 'border-blue-600 scale-110'
                                    : 'border-white shadow'
                                )}
                                style={{ backgroundColor: value.colorHex }}
                              />
                            ) : null}
                            <span
                              className={cn(
                                'text-sm font-medium',
                                isSelected
                                  ? 'text-blue-700'
                                  : available
                                  ? 'text-gray-700'
                                  : 'text-gray-400'
                              )}
                            >
                              {value.value}
                            </span>
                            {isSelected && (
                              <div className="absolute -top-2 -right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-800">数量</h3>
                  {selectedSku && selectedSku.stock < 10 && (
                    <span className="text-xs text-red-500 font-medium animate-pulse">
                      仅剩 {selectedSku.stock} 件！
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="p-3 hover:bg-gray-50 transition-colors"
                    >
                      <Minus className="w-4 h-4 text-gray-600" />
                    </button>
                    <span className="w-16 text-center font-medium text-gray-800">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="p-3 hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <span className="text-sm text-gray-500">
                    库存 {selectedSku ? selectedSku.stock : totalStock} 件
                  </span>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2 py-4 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                  加入购物车
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-200"
                >
                  <Package className="w-5 h-5" />
                  立即购买
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Truck className="w-4 h-4 text-green-600" />
                    <span>顺丰包邮</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span>正品保证</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <RotateCcw className="w-4 h-4 text-orange-600" />
                    <span>7天无理由</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            商品详情
          </h3>
          <div className="prose prose-sm max-w-none text-gray-600">
            <p>{product.description}</p>
            <p className="mt-4">
              精选优质原材料，匠心工艺打造，舒适亲肤，经久耐穿。多色多码可选，满足您不同场合的穿着需求。
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
