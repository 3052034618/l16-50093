import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout/Layout';
import ProductList from '@/pages/ProductList/ProductList';
import ProductEdit from '@/pages/ProductEdit/ProductEdit';
import StockFlow from '@/pages/StockFlow/StockFlow';
import StockWarning from '@/pages/StockWarning/StockWarning';
import ProductPreview from '@/pages/ProductPreview/ProductPreview';
import { useProductStore } from '@/store/productStore';

function StoreInitializer({ children }: { children: React.ReactNode }) {
  const initializeStore = useProductStore((s) => s.initializeStore);
  const initialized = useProductStore((s) => s.initialized);

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <StoreInitializer>
      <Router>
        <Routes>
          <Route path="/product/preview" element={<ProductPreview />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<ProductList />} />
            <Route path="product/:id" element={<ProductEdit />} />
            <Route path="inventory/flow" element={<StockFlow />} />
            <Route path="inventory/warning" element={<StockWarning />} />
          </Route>
        </Routes>
      </Router>
    </StoreInitializer>
  );
}
