import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Eye,
  Save,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { useProductStore } from '@/store/productStore';
import AttributeConfig from '@/components/AttributeConfig/AttributeConfig';
import SkuTable from '@/components/SkuTable/SkuTable';
import { exportSkusToExcel } from '@/utils/excelExport';

export default function ProductEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    getProductById,
    getDimensionsByProductId,
    getSkusByProductId,
    saveProductSkus,
  } = useProductStore();

  const product = id ? getProductById(id) : undefined;
  const dimensions = id ? getDimensionsByProductId(id) : [];
  const skus = id ? getSkusByProductId(id) : [];

  const [activeTab, setActiveTab] = useState<'attributes' | 'skus'>('attributes');

  const handleExport = () => {
    if (!product) return;
    exportSkusToExcel(product, skus, dimensions);
  };

  const handleSave = () => {
    if (!id) return;
    saveProductSkus(id, '管理员');
  };

  const handlePreview = () => {
    navigate('/product/preview', { state: { productId: id } });
  };

  const totalStock = useMemo(
    () => skus.reduce((sum, s) => sum + s.stock, 0),
    [skus]
  );
  const totalValue = useMemo(
    () => skus.reduce((sum, s) => sum + s.stock * s.costPrice, 0),
    [skus]
  );
  const warningCount = useMemo(() => {
    if (!product) return 0;
    return skus.filter((s) => s.stock < product.warningThreshold).length;
  }, [skus, product]);

  if (!product) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">商品不存在</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{product.name}</h1>
            <p className="text-sm text-gray-500">{product.category}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePreview}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            预览
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            导出Excel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            保存
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Layers className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">SKU数量</p>
              <p className="text-xl font-bold text-gray-800">{skus.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Layers className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">总库存</p>
              <p className="text-xl font-bold text-gray-800">{totalStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Layers className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">库存价值</p>
              <p className="text-xl font-bold text-gray-800">
                ¥{totalValue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 shadow-sm border border-red-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-red-600">预警SKU</p>
              <p className="text-xl font-bold text-red-700">{warningCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-100 px-5">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('attributes')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'attributes'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              属性维度配置
            </button>
            <button
              onClick={() => setActiveTab('skus')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'skus'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              SKU 列表编辑
            </button>
          </div>
        </div>

        <div className="p-5">
          {activeTab === 'attributes' && id && <AttributeConfig productId={id} />}
          {activeTab === 'skus' && id && (
            <SkuTable productId={id} dimensions={dimensions} />
          )}
        </div>
      </div>
    </div>
  );
}
