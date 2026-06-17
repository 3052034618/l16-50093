import { useState, useMemo } from 'react';
import {
  Search,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { useProductStore } from '@/store/productStore';
import { exportStockFlowToExcel } from '@/utils/excelExport';
import { cn } from '@/lib/utils';
import type { StockFlowType } from '@/types';

export default function StockFlow() {
  const { products, getStockFlows } = useProductStore();

  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState('');

  const flows = useMemo(() => {
    let result = getStockFlows({
      productId: selectedProduct || undefined,
      type: selectedType,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

    if (searchKeyword) {
      result = result.filter(
        (f) =>
          f.skuCode.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          f.productName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          f.remark.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          f.operator.toLowerCase().includes(searchKeyword.toLowerCase())
      );
    }

    return result;
  }, [getStockFlows, selectedProduct, selectedType, startDate, endDate, searchKeyword]);

  const stats = useMemo(() => {
    const totalIn = flows
      .filter((f) => f.type === 'in')
      .reduce((sum, f) => sum + f.quantity, 0);
    const totalOut = flows
      .filter((f) => f.type === 'out')
      .reduce((sum, f) => sum + Math.abs(f.quantity), 0);
    const adjustCount = flows.filter((f) => f.type === 'adjust').length;

    return { total: flows.length, totalIn, totalOut, adjustCount };
  }, [flows]);

  const getTypeIcon = (type: StockFlowType) => {
    switch (type) {
      case 'in':
        return <ArrowDownRight className="w-4 h-4" />;
      case 'out':
        return <ArrowUpRight className="w-4 h-4" />;
      case 'adjust':
        return <Settings className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: StockFlowType) => {
    switch (type) {
      case 'in':
        return '入库';
      case 'out':
        return '出库';
      case 'adjust':
        return '调整';
    }
  };

  const getTypeColor = (type: StockFlowType, quantity: number) => {
    if (type === 'in') return 'text-green-600 bg-green-50';
    if (type === 'out') return 'text-red-600 bg-red-50';
    return quantity >= 0 ? 'text-blue-600 bg-blue-50' : 'text-orange-600 bg-orange-50';
  };

  const handleExport = () => {
    exportStockFlowToExcel(flows);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">流水总数</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">入库总数</p>
              <p className="text-2xl font-bold text-green-600">+{stats.totalIn}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <ArrowDownRight className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">出库总数</p>
              <p className="text-2xl font-bold text-red-600">-{stats.totalOut}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">调整次数</p>
              <p className="text-2xl font-bold text-blue-600">{stats.adjustCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
          </div>
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
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="">全部商品</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="all">全部类型</option>
                <option value="in">入库</option>
                <option value="out">出库</option>
                <option value="adjust">调整</option>
              </select>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <span className="text-gray-400">至</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              导出Excel
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  时间
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  商品名称
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  SKU编码
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  类型
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  变动数量
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  变动前库存
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  变动后库存
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  操作人
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  备注
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {flows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-gray-500">
                    <Filter className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>暂无库存流水记录</p>
                  </td>
                </tr>
              ) : (
                flows.map((flow) => (
                  <tr
                    key={flow.id}
                    className="hover:bg-blue-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-700">
                        {new Date(flow.createdAt).toLocaleDateString('zh-CN')}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(flow.createdAt).toLocaleTimeString('zh-CN')}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">
                        {flow.productName}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-gray-700">
                        {flow.skuCode}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                          getTypeColor(flow.type, flow.quantity)
                        )}
                      >
                        {getTypeIcon(flow.type)}
                        {getTypeLabel(flow.type)}
                      </span>
                    </td>

                    <td
                      className={cn(
                        'px-4 py-3 text-right text-sm font-semibold',
                        flow.quantity > 0
                          ? 'text-green-600'
                          : flow.quantity < 0
                          ? 'text-red-600'
                          : 'text-gray-600'
                      )}
                    >
                      {flow.quantity > 0 ? '+' : ''}
                      {flow.quantity}
                    </td>

                    <td className="px-4 py-3 text-right text-sm text-gray-600">
                      {flow.beforeStock}
                    </td>

                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                      {flow.afterStock}
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {flow.operator}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500">
                        {flow.remark}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {flows.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              共 <span className="font-medium text-gray-700">{flows.length}</span> 条记录
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
