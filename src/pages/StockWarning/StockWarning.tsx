import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  Check,
  Settings,
  Search,
  Filter,
  TrendingDown,
  ChevronRight,
  Package,
} from 'lucide-react';
import { useProductStore } from '@/store/productStore';
import { cn } from '@/lib/utils';
import type { WarningLevel } from '@/types';

export default function StockWarning() {
  const navigate = useNavigate();
  const { products, skus, stockWarnings, resolveWarning, getWarningLevel } =
    useProductStore();

  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showResolved, setShowResolved] = useState(false);

  const warnings = useMemo(() => {
    let result = stockWarnings;

    if (!showResolved) {
      result = result.filter((w) => !w.resolved);
    }

    if (selectedLevel !== 'all') {
      result = result.filter((w) => w.level === selectedLevel);
    }

    if (searchKeyword) {
      result = result.filter(
        (w) =>
          w.skuCode.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          w.productName.toLowerCase().includes(searchKeyword.toLowerCase())
      );
    }

    return result.sort((a, b) => {
      const levelOrder = { high: 0, medium: 1, low: 2 };
      return levelOrder[a.level] - levelOrder[b.level];
    });
  }, [stockWarnings, showResolved, selectedLevel, searchKeyword]);

  const stats = useMemo(() => {
    const unresolved = stockWarnings.filter((w) => !w.resolved);
    return {
      total: unresolved.length,
      high: unresolved.filter((w) => w.level === 'high').length,
      medium: unresolved.filter((w) => w.level === 'medium').length,
      low: unresolved.filter((w) => w.level === 'low').length,
    };
  }, [stockWarnings]);

  const getLevelIcon = (level: WarningLevel) => {
    switch (level) {
      case 'high':
        return <AlertOctagon className="w-5 h-5" />;
      case 'medium':
        return <AlertCircle className="w-5 h-5" />;
      case 'low':
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getLevelLabel = (level: WarningLevel) => {
    switch (level) {
      case 'high':
        return '高危';
      case 'medium':
        return '中危';
      case 'low':
        return '低危';
    }
  };

  const getLevelColor = (level: WarningLevel) => {
    switch (level) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }
  };

  const getProgressColor = (level: WarningLevel) => {
    switch (level) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-amber-500';
      case 'low':
        return 'bg-yellow-500';
    }
  };

  const handleResolve = (warningId: string) => {
    resolveWarning(warningId);
  };

  const handleGoToProduct = (productName: string) => {
    const product = products.find((p) => p.name === productName);
    if (product) {
      navigate(`/product/${product.id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-5 text-white shadow-lg shadow-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-100 mb-1">高危预警</p>
              <p className="text-3xl font-bold">{stats.high}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <AlertOctagon className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-red-100 mt-3">库存低于阈值30%</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-5 text-white shadow-lg shadow-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-100 mb-1">中危预警</p>
              <p className="text-3xl font-bold">{stats.medium}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-amber-100 mt-3">库存低于阈值60%</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl p-5 text-white shadow-lg shadow-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-100 mb-1">低危预警</p>
              <p className="text-3xl font-bold">{stats.low}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-yellow-100 mt-3">库存即将低于阈值</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">预警总数</p>
              <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-gray-600" />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">需及时处理</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索SKU编码、商品名称..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-64 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="all">全部等级</option>
                <option value="high">高危</option>
                <option value="medium">中危</option>
                <option value="low">低危</option>
              </select>

              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showResolved}
                  onChange={(e) => setShowResolved(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                显示已处理
              </label>
            </div>

            <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              <Settings className="w-4 h-4" />
              阈值设置
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {warnings.length === 0 ? (
            <div className="py-16 text-center">
              <Check className="w-16 h-16 text-green-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">暂无库存预警</p>
              <p className="text-sm text-gray-400 mt-1">所有商品库存状态良好</p>
            </div>
          ) : (
            warnings.map((warning) => (
              <div
                key={warning.id}
                className={cn(
                  'p-5 hover:bg-gray-50 transition-colors',
                  warning.resolved && 'opacity-60 bg-gray-50'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                        getLevelColor(warning.level)
                      )}
                    >
                      {getLevelIcon(warning.level)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-800">
                          {warning.productName}
                        </h3>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-xs font-medium',
                            getLevelColor(warning.level)
                          )}
                        >
                          {getLevelLabel(warning.level)}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                          {warning.skuCode}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        {Object.entries(warning.attributes || {}).map(
                          ([key, value]) => (
                            <span key={key} className="flex items-center gap-1">
                              <span className="text-gray-400">{key}:</span>
                              <span className="text-gray-600">{value}</span>
                            </span>
                          )
                        )}
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">当前库存:</span>
                          <span
                            className={cn(
                              'text-sm font-bold',
                              warning.level === 'high' && 'text-red-600',
                              warning.level === 'medium' && 'text-amber-600',
                              warning.level === 'low' && 'text-yellow-600'
                            )}
                          >
                            {warning.currentStock} 件
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">预警阈值:</span>
                          <span className="text-sm text-gray-700">
                            {warning.threshold} 件
                          </span>
                        </div>
                        <div className="flex-1 max-w-xs">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                getProgressColor(warning.level)
                              )}
                              style={{
                                width: `${Math.min(100, (warning.currentStock / warning.threshold) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {warning.resolved ? (
                      <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                        已处理
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleGoToProduct(warning.productName)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                        >
                          <Package className="w-4 h-4" />
                          补货
                        </button>
                        <button
                          onClick={() => handleResolve(warning.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          标记处理
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {warnings.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              共 <span className="font-medium text-gray-700">{warnings.length}</span> 条预警
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
