import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Package,
  Layers,
  AlertTriangle,
  TrendingUp,
  ChevronRight,
  Filter,
  Plus,
  Edit,
} from 'lucide-react';
import { useProductStore } from '@/store/productStore';
import { cn } from '@/lib/utils';

const categories = ['全部', '服装', '鞋靴', '箱包', '数码配件'];

export default function ProductList() {
  const navigate = useNavigate();
  const {
    products,
    skus,
    stockWarnings,
    getWarningLevel,
  } = useProductStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalSkus = skus.length;
    const totalStock = skus.reduce((sum, s) => sum + s.stock, 0);
    const warningCount = stockWarnings.filter((w) => !w.resolved).length;

    return { totalProducts, totalSkus, totalStock, warningCount };
  }, [products, skus, stockWarnings]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory =
        selectedCategory === '全部' || p.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const getProductSkuCount = (productId: string) => {
    return skus.filter((s) => s.productId === productId).length;
  };

  const getProductStock = (productId: string) => {
    return skus.filter((s) => s.productId === productId).reduce((sum, s) => sum + s.stock, 0);
  };

  const getProductWarningCount = (productId: string) => {
    const productSkus = skus.filter((s) => s.productId === productId);
    const product = products.find((p) => p.id === productId);
    if (!product) return 0;
    return productSkus.filter((s) => s.stock < product.warningThreshold).length;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">商品总数</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalProducts}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-green-600">
            <TrendingUp className="w-3 h-3 mr-1" />
            <span>较上月 +12%</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">SKU总数</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalSkus}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Layers className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-green-600">
            <TrendingUp className="w-3 h-3 mr-1" />
            <span>较上月 +8%</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">库存总量</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalStock.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Package className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-gray-500">
            <span>件商品</span>
          </div>
        </div>

        <div
          className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-5 shadow-sm border border-red-100 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/inventory/warning')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 mb-1">预警SKU</p>
              <p className="text-2xl font-bold text-red-700">{stats.warningCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-red-600">
            <span>需及时补货</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索商品名称、描述..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
              新增商品
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => {
              const skuCount = getProductSkuCount(product.id);
              const stock = getProductStock(product.id);
              const warningCount = getProductWarningCount(product.id);

              return (
                <div
                  key={product.id}
                  className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                    <img
                      src={product.coverImage}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 bg-white/90 backdrop-blur text-xs font-medium text-gray-700 rounded-full">
                        {product.category}
                      </span>
                    </div>
                    {warningCount > 0 && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-medium rounded-full flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          {warningCount}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-1 truncate group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2 h-10">
                      {product.description}
                    </p>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Layers className="w-4 h-4" />
                        <span>{skuCount} 个SKU</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Package className="w-4 h-4" />
                        <span>{stock} 库存</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        预警阈值: {product.warningThreshold}件
                      </span>
                      <span className="text-blue-600 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                        编辑
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="py-16 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">暂无匹配的商品</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
