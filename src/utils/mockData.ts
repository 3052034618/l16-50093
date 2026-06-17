import type {
  Product,
  AttributeDimension,
  Sku,
  StockFlow,
  StockWarning,
} from '@/types';

export const mockProducts: Product[] = [
  {
    id: 'prod001',
    name: '经典圆领纯棉T恤',
    description: '精选优质纯棉面料，舒适透气，多色多码可选',
    category: '服装',
    coverImage:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=classic%20white%20cotton%20t-shirt%20product%20photo%20on%20white%20background&image_size=square',
    warningThreshold: 50,
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-06-10T14:30:00Z',
  },
  {
    id: 'prod002',
    name: '时尚运动跑鞋',
    description: '轻量化设计，缓震科技，适合日常运动和休闲穿搭',
    category: '鞋靴',
    coverImage:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20sports%20running%20shoes%20product%20photo%20on%20white%20background&image_size=square',
    warningThreshold: 30,
    createdAt: '2025-02-20T09:00:00Z',
    updatedAt: '2025-05-28T16:00:00Z',
  },
  {
    id: 'prod003',
    name: '真皮商务手提包',
    description: '头层牛皮制作，大容量设计，商务通勤必备',
    category: '箱包',
    coverImage:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=leather%20business%20briefcase%20bag%20product%20photo%20on%20white%20background&image_size=square',
    warningThreshold: 20,
    createdAt: '2025-03-05T11:00:00Z',
    updatedAt: '2025-06-01T10:00:00Z',
  },
  {
    id: 'prod004',
    name: '无线蓝牙耳机',
    description: '主动降噪，高清音质，超长续航',
    category: '数码配件',
    coverImage:
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wireless%20bluetooth%20earbuds%20product%20photo%20on%20white%20background&image_size=square',
    warningThreshold: 100,
    createdAt: '2025-04-10T08:00:00Z',
    updatedAt: '2025-06-15T09:00:00Z',
  },
];

export const mockDimensions: AttributeDimension[] = [
  {
    id: 'dim_color_001',
    productId: 'prod001',
    name: '颜色',
    sortOrder: 1,
    values: [
      {
        id: 'val_white_001',
        dimensionId: 'dim_color_001',
        value: '白色',
        colorHex: '#FFFFFF',
        sortOrder: 1,
      },
      {
        id: 'val_black_001',
        dimensionId: 'dim_color_001',
        value: '黑色',
        colorHex: '#1F2937',
        sortOrder: 2,
      },
      {
        id: 'val_blue_001',
        dimensionId: 'dim_color_001',
        value: '藏蓝',
        colorHex: '#1e40af',
        sortOrder: 3,
      },
      {
        id: 'val_green_001',
        dimensionId: 'dim_color_001',
        value: '军绿',
        colorHex: '#65a30d',
        sortOrder: 4,
      },
    ],
  },
  {
    id: 'dim_size_001',
    productId: 'prod001',
    name: '尺码',
    sortOrder: 2,
    values: [
      {
        id: 'val_s_001',
        dimensionId: 'dim_size_001',
        value: 'S',
        sortOrder: 1,
      },
      {
        id: 'val_m_001',
        dimensionId: 'dim_size_001',
        value: 'M',
        sortOrder: 2,
      },
      {
        id: 'val_l_001',
        dimensionId: 'dim_size_001',
        value: 'L',
        sortOrder: 3,
      },
      {
        id: 'val_xl_001',
        dimensionId: 'dim_size_001',
        value: 'XL',
        sortOrder: 4,
      },
      {
        id: 'val_xxl_001',
        dimensionId: 'dim_size_001',
        value: 'XXL',
        sortOrder: 5,
      },
    ],
  },
  {
    id: 'dim_material_001',
    productId: 'prod001',
    name: '材质',
    sortOrder: 3,
    values: [
      {
        id: 'val_cotton_001',
        dimensionId: 'dim_material_001',
        value: '精梳棉',
        sortOrder: 1,
      },
      {
        id: 'val_bamboo_001',
        dimensionId: 'dim_material_001',
        value: '竹纤维',
        sortOrder: 2,
      },
    ],
  },
  {
    id: 'dim_color_002',
    productId: 'prod002',
    name: '颜色',
    sortOrder: 1,
    values: [
      {
        id: 'val_white_002',
        dimensionId: 'dim_color_002',
        value: '白色',
        colorHex: '#FFFFFF',
        sortOrder: 1,
      },
      {
        id: 'val_black_002',
        dimensionId: 'dim_color_002',
        value: '黑色',
        colorHex: '#1F2937',
        sortOrder: 2,
      },
      {
        id: 'val_red_002',
        dimensionId: 'dim_color_002',
        value: '红色',
        colorHex: '#dc2626',
        sortOrder: 3,
      },
    ],
  },
  {
    id: 'dim_size_002',
    productId: 'prod002',
    name: '尺码',
    sortOrder: 2,
    values: [
      {
        id: 'val_39',
        dimensionId: 'dim_size_002',
        value: '39码',
        sortOrder: 1,
      },
      {
        id: 'val_40',
        dimensionId: 'dim_size_002',
        value: '40码',
        sortOrder: 2,
      },
      {
        id: 'val_41',
        dimensionId: 'dim_size_002',
        value: '41码',
        sortOrder: 3,
      },
      {
        id: 'val_42',
        dimensionId: 'dim_size_002',
        value: '42码',
        sortOrder: 4,
      },
      {
        id: 'val_43',
        dimensionId: 'dim_size_002',
        value: '43码',
        sortOrder: 5,
      },
      {
        id: 'val_44',
        dimensionId: 'dim_size_002',
        value: '44码',
        sortOrder: 6,
      },
    ],
  },
  {
    id: 'dim_color_003',
    productId: 'prod003',
    name: '颜色',
    sortOrder: 1,
    values: [
      {
        id: 'val_black_003',
        dimensionId: 'dim_color_003',
        value: '黑色',
        colorHex: '#1F2937',
        sortOrder: 1,
      },
      {
        id: 'val_brown_003',
        dimensionId: 'dim_color_003',
        value: '棕色',
        colorHex: '#92400e',
        sortOrder: 2,
      },
    ],
  },
  {
    id: 'dim_color_004',
    productId: 'prod004',
    name: '颜色',
    sortOrder: 1,
    values: [
      {
        id: 'val_white_004',
        dimensionId: 'dim_color_004',
        value: '白色',
        colorHex: '#FFFFFF',
        sortOrder: 1,
      },
      {
        id: 'val_black_004',
        dimensionId: 'dim_color_004',
        value: '黑色',
        colorHex: '#1F2937',
        sortOrder: 2,
      },
    ],
  },
  {
    id: 'dim_version_004',
    productId: 'prod004',
    name: '版本',
    sortOrder: 2,
    values: [
      {
        id: 'val_standard',
        dimensionId: 'dim_version_004',
        value: '标准版',
        sortOrder: 1,
      },
      {
        id: 'val_pro',
        dimensionId: 'dim_version_004',
        value: 'Pro版',
        sortOrder: 2,
      },
    ],
  },
];

const generateId = () =>
  Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

export const generateMockSkus = (): Sku[] => {
  const skus: Sku[] = [];

  const tshirtColors = ['白色', '黑色', '藏蓝', '军绿'];
  const tshirtSizes = ['S', 'M', 'L', 'XL', 'XXL'];
  const tshirtMaterials = ['精梳棉', '竹纤维'];
  const colorHexMap: Record<string, string> = {
    白色: '#FFFFFF',
    黑色: '#1F2937',
    藏蓝: '#1e40af',
    军绿: '#65a30d',
    红色: '#dc2626',
    棕色: '#92400e',
  };

  const dimColor001 = mockDimensions.find((d) => d.id === 'dim_color_001');
  const dimSize001 = mockDimensions.find((d) => d.id === 'dim_size_001');
  const dimMaterial001 = mockDimensions.find((d) => d.id === 'dim_material_001');

  let index = 1;
  tshirtColors.forEach((color) => {
    tshirtSizes.forEach((size) => {
      tshirtMaterials.forEach((material) => {
        const colorVal = dimColor001?.values.find((v) => v.value === color);
        const sizeVal = dimSize001?.values.find((v) => v.value === size);
        const materialVal = dimMaterial001?.values.find(
          (v) => v.value === material
        );

        if (colorVal && sizeVal && materialVal) {
          skus.push({
            id: `sku_tshirt_${index}`,
            productId: 'prod001',
            skuCode: `TS-${String(index).padStart(4, '0')}`,
            attributes: {
              dim_color_001: colorVal.id,
              dim_size_001: sizeVal.id,
              dim_material_001: materialVal.id,
            },
            attributeLabels: {
              颜色: color,
              尺码: size,
              材质: material,
            },
            salePrice: material === '竹纤维' ? 129 : 99,
            costPrice: material === '竹纤维' ? 55 : 40,
            stock: Math.floor(Math.random() * 200) + 10,
          });
          index++;
        }
      });
    });
  });

  const shoeColors = ['白色', '黑色', '红色'];
  const shoeSizes = ['39码', '40码', '41码', '42码', '43码', '44码'];
  const dimColor002 = mockDimensions.find((d) => d.id === 'dim_color_002');
  const dimSize002 = mockDimensions.find((d) => d.id === 'dim_size_002');

  index = 1;
  shoeColors.forEach((color) => {
    shoeSizes.forEach((size) => {
      const colorVal = dimColor002?.values.find((v) => v.value === color);
      const sizeVal = dimSize002?.values.find((v) => v.value === size);

      if (colorVal && sizeVal) {
        const stock = Math.floor(Math.random() * 100);
        skus.push({
          id: `sku_shoe_${index}`,
          productId: 'prod002',
          skuCode: `SH-${String(index).padStart(4, '0')}`,
          attributes: {
            dim_color_002: colorVal.id,
            dim_size_002: sizeVal.id,
          },
          attributeLabels: {
            颜色: color,
            尺码: size,
          },
          salePrice: 399,
          costPrice: 180,
          stock: stock > 30 ? stock : stock + 5,
        });
        index++;
      }
    });
  });

  const bagColors = ['黑色', '棕色'];
  const dimColor003 = mockDimensions.find((d) => d.id === 'dim_color_003');

  index = 1;
  bagColors.forEach((color) => {
    const colorVal = dimColor003?.values.find((v) => v.value === color);
    if (colorVal) {
      skus.push({
        id: `sku_bag_${index}`,
        productId: 'prod003',
        skuCode: `BG-${String(index).padStart(4, '0')}`,
        attributes: {
          dim_color_003: colorVal.id,
        },
        attributeLabels: {
          颜色: color,
        },
        salePrice: 899,
        costPrice: 350,
        stock: Math.floor(Math.random() * 50) + 5,
      });
      index++;
    }
  });

  const earbudColors = ['白色', '黑色'];
  const earbudVersions = ['标准版', 'Pro版'];
  const dimColor004 = mockDimensions.find((d) => d.id === 'dim_color_004');
  const dimVersion004 = mockDimensions.find((d) => d.id === 'dim_version_004');

  index = 1;
  earbudColors.forEach((color) => {
    earbudVersions.forEach((version) => {
      const colorVal = dimColor004?.values.find((v) => v.value === color);
      const versionVal = dimVersion004?.values.find((v) => v.value === version);

      if (colorVal && versionVal) {
        skus.push({
          id: `sku_earbud_${index}`,
          productId: 'prod004',
          skuCode: `EB-${String(index).padStart(4, '0')}`,
          attributes: {
            dim_color_004: colorVal.id,
            dim_version_004: versionVal.id,
          },
          attributeLabels: {
            颜色: color,
            版本: version,
          },
          salePrice: version === 'Pro版' ? 599 : 299,
          costPrice: version === 'Pro版' ? 250 : 120,
          stock: Math.floor(Math.random() * 300) + 50,
        });
        index++;
      }
    });
  });

  return skus;
};

export const mockSkus = generateMockSkus();

export const mockStockFlows: StockFlow[] = (() => {
  const flows: StockFlow[] = [];
  const operators = ['张三', '李四', '王五', '赵六'];
  const remarks = [
    '采购入库',
    '销售出库',
    '盘点调整',
    '退货入库',
    '赠品出库',
    '调拨入库',
  ];
  const types: Array<'in' | 'out' | 'adjust'> = ['in', 'out', 'adjust'];

  const productSkus = mockSkus.slice(0, 10);

  for (let i = 0; i < 50; i++) {
    const sku = productSkus[Math.floor(Math.random() * productSkus.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const quantity = Math.floor(Math.random() * 50) + 1;
    const beforeStock = Math.floor(Math.random() * 200) + 20;

    let afterStock: number;
    if (type === 'in') {
      afterStock = beforeStock + quantity;
    } else if (type === 'out') {
      afterStock = beforeStock - quantity;
    } else {
      afterStock = beforeStock + (Math.random() > 0.5 ? 1 : -1) * quantity;
    }

    const product = mockProducts.find((p) => p.id === sku.productId);

    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    date.setHours(Math.floor(Math.random() * 24));
    date.setMinutes(Math.floor(Math.random() * 60));

    flows.push({
      id: `flow_${i + 1}`,
      skuId: sku.id,
      skuCode: sku.skuCode,
      productName: product?.name || '',
      type,
      quantity: type === 'out' ? -quantity : type === 'adjust' ? (Math.random() > 0.5 ? quantity : -quantity) : quantity,
      beforeStock,
      afterStock: Math.max(0, afterStock),
      operator: operators[Math.floor(Math.random() * operators.length)],
      remark: remarks[Math.floor(Math.random() * remarks.length)],
      createdAt: date.toISOString(),
    });
  }

  return flows.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
})();

export const mockStockWarnings: StockWarning[] = (() => {
  const warnings: StockWarning[] = [];

  const lowStockSkus = mockSkus.filter((s) => s.stock < 50).slice(0, 8);

  lowStockSkus.forEach((sku, index) => {
    const product = mockProducts.find((p) => p.id === sku.productId);
    const threshold = product?.warningThreshold || 50;
    const ratio = sku.stock / threshold;
    let level: 'low' | 'medium' | 'high';
    if (ratio <= 0.3) level = 'high';
    else if (ratio <= 0.6) level = 'medium';
    else level = 'low';

    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 7));

    warnings.push({
      id: `warn_${index + 1}`,
      skuId: sku.id,
      skuCode: sku.skuCode,
      productName: product?.name || '',
      attributes: sku.attributeLabels,
      currentStock: sku.stock,
      threshold,
      level,
      resolved: false,
      createdAt: date.toISOString(),
    });
  });

  return warnings;
})();
