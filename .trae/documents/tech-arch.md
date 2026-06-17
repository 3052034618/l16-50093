## 1. 架构设计

```mermaid
graph TD
    subgraph "前端应用层"
        A["React SPA 应用"]
        B["路由管理 (React Router)"]
        C["状态管理 (Zustand)"]
        D["UI 组件库"]
    end
    
    subgraph "业务逻辑层"
        E["商品管理模块"]
        F["SKU 生成引擎"]
        G["库存管理模块"]
        H["预警模块"]
        I["导出模块"]
    end
    
    subgraph "数据层"
        J["Mock 数据服务"]
        K["LocalStorage 持久化"]
        L["类型定义 (TypeScript)"]
    end
    
    subgraph "外部服务"
        M["Excel 导出 (xlsx)"]
        N["图标库 (lucide-react)"]
    end
    
    A --> B
    A --> C
    A --> D
    E --> F
    G --> H
    E --> J
    G --> J
    H --> J
    I --> M
    J --> K
    C --> L
```

## 2. 技术描述

- **前端框架**：React 18 + TypeScript 5
- **构建工具**：Vite 5
- **样式方案**：TailwindCSS 3 + CSS Variables
- **路由管理**：React Router v6
- **状态管理**：Zustand (轻量级状态管理)
- **UI 组件**：自定义组件 + lucide-react 图标
- **Excel 导出**：xlsx (SheetJS)
- **数据持久化**：LocalStorage + Mock 数据
- **代码规范**：ESLint + Prettier

## 3. 路由定义

| 路由路径 | 页面名称 | 功能描述 |
|----------|----------|----------|
| / | 商品列表页 | 商品概览、搜索筛选、预警统计 |
| /product/:id | 商品SKU编辑页 | 属性配置、SKU表格编辑、批量保存 |
| /inventory/flow | 库存流水页 | 库存变动记录、筛选查询 |
| /inventory/warning | 库存预警页 | 预警列表、阈值配置 |
| /product/preview | 前台商品预览 | 属性可视化选择、SKU展示 |

## 4. 数据模型

### 4.1 数据模型定义

```mermaid
erDiagram
    PRODUCT ||--o{ SKU : "包含"
    PRODUCT ||--o{ ATTRIBUTE_DIMENSION : "拥有"
    ATTRIBUTE_DIMENSION ||--o{ ATTRIBUTE_VALUE : "包含"
    SKU ||--o{ STOCK_FLOW : "产生"
    SKU ||--o| STOCK_WARNING : "触发"
    
    PRODUCT {
        string id PK
        string name
        string description
        string category
        string coverImage
        number warningThreshold
        date createdAt
        date updatedAt
    }
    
    ATTRIBUTE_DIMENSION {
        string id PK
        string productId FK
        string name
        number sortOrder
    }
    
    ATTRIBUTE_VALUE {
        string id PK
        string dimensionId FK
        string value
        string imageUrl
        string colorHex
        number sortOrder
    }
    
    SKU {
        string id PK
        string productId FK
        string skuCode
        string attributeCombination
        number salePrice
        number costPrice
        number stock
        string imageUrl
    }
    
    STOCK_FLOW {
        string id PK
        string skuId FK
        string type
        number quantity
        number beforeStock
        number afterStock
        string operator
        string remark
        date createdAt
    }
    
    STOCK_WARNING {
        string id PK
        string skuId FK
        number currentStock
        number threshold
        string level
        boolean resolved
        date createdAt
    }
```

### 4.2 类型定义

```typescript
// 商品
interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  coverImage: string;
  warningThreshold: number;
  createdAt: string;
  updatedAt: string;
}

// 属性维度
interface AttributeDimension {
  id: string;
  productId: string;
  name: string;
  sortOrder: number;
  values: AttributeValue[];
}

// 属性值
interface AttributeValue {
  id: string;
  dimensionId: string;
  value: string;
  imageUrl?: string;
  colorHex?: string;
  sortOrder: number;
}

// SKU
interface Sku {
  id: string;
  productId: string;
  skuCode: string;
  attributes: Record<string, string>;
  attributeLabels: Record<string, string>;
  salePrice: number;
  costPrice: number;
  stock: number;
  imageUrl?: string;
}

// 库存流水
interface StockFlow {
  id: string;
  skuId: string;
  skuCode: string;
  productName: string;
  type: 'in' | 'out' | 'adjust';
  quantity: number;
  beforeStock: number;
  afterStock: number;
  operator: string;
  remark: string;
  createdAt: string;
}

// 库存预警
interface StockWarning {
  id: string;
  skuId: string;
  skuCode: string;
  productName: string;
  attributes: Record<string, string>;
  currentStock: number;
  threshold: number;
  level: 'low' | 'medium' | 'high';
  resolved: boolean;
  createdAt: string;
}
```

## 5. 目录结构

```
src/
├── components/          # 通用组件
│   ├── Layout/         # 布局组件
│   ├── Table/          # 表格组件
│   ├── Modal/          # 弹窗组件
│   └── Form/           # 表单组件
├── pages/              # 页面组件
│   ├── ProductList/    # 商品列表页
│   ├── ProductEdit/    # 商品SKU编辑页
│   ├── StockFlow/      # 库存流水页
│   ├── StockWarning/   # 库存预警页
│   └── ProductPreview/ # 前台商品预览页
├── store/              # 状态管理
│   ├── productStore.ts
│   └── stockStore.ts
├── types/              # 类型定义
│   └── index.ts
├── utils/              # 工具函数
│   ├── skuGenerator.ts # SKU笛卡尔积生成
│   ├── excelExport.ts  # Excel导出
│   └── mockData.ts     # Mock数据
├── hooks/              # 自定义Hooks
│   └── useSku.ts
├── App.tsx
├── main.tsx
└── index.css
```

## 6. 核心算法

### 6.1 笛卡尔积SKU生成算法

```typescript
function generateSkuCombinations(dimensions: AttributeDimension[]): Sku[] {
  // 递归生成所有属性组合
  // 为每个组合生成唯一SKU
  // 初始化默认价格、成本、库存
}
```

### 6.2 库存预警等级计算

```typescript
function getWarningLevel(stock: number, threshold: number): 'low' | 'medium' | 'high' {
  const ratio = stock / threshold;
  if (ratio <= 0.3) return 'high';      // 高危
  if (ratio <= 0.6) return 'medium';    // 中危
  return 'low';                          // 低危
}
```
