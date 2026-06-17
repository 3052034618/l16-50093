import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout/Layout';
import ProductList from '@/pages/ProductList/ProductList';
import ProductEdit from '@/pages/ProductEdit/ProductEdit';
import StockFlow from '@/pages/StockFlow/StockFlow';
import StockWarning from '@/pages/StockWarning/StockWarning';
import ProductPreview from '@/pages/ProductPreview/ProductPreview';

export default function App() {
  return (
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
  );
}
