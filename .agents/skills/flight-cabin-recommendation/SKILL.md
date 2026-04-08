---
name: flight-cabin-recommendation
version: 1.0.0
description: |
  对话流航班推荐与商务舱展示系统。提供Schema定义、编排层、CabinKB机型知识库，
  用于构建智能对话式机票推荐服务。
author: Fliggy Team
license: MIT
---

# Flight Cabin Recommendation

对话流商务舱推荐系统的参考实现，包含Schema定义、编排层、CabinKB机型知识库。

## 目录结构

```
flight-cabin-recommendation/
├── SKILL.md                     # 本文档
├── package.json                 # 包配置
├── schemas/                     # JSON Schema定义
│   ├── flight-card.schema.json  # 航班卡片Schema
│   └── cabin-upsell.schema.json # 舱位升级Schema
├── cabin-kb/                    # 机型知识库
│   ├── index.js                 # CabinKB查询接口
│   └── fixtures.json            # 示例数据
└── orchestrator/                # 编排层
    ├── index.js                 # 推荐编排逻辑
    └── slots.js                 # 槽位策略
```

## 核心API

### 1. CabinKB 机型知识库

```javascript
import { getCabinPresentation } from 'flight-cabin-recommendation/cabin-kb';

const cabin = getCabinPresentation({
  airlineCode: 'CX',      // 航司代码
  equipment: 'A350-1000'  // 机型
});

// 返回:
// {
//   aircraftKey: 'CX|A350-1000',
//   facts: { businessSeats: 46, score: 4.62, ... },
//   images: [{ url, alt, width, height }],
//   accordion: [{ sectionId, title, bullets, imageUrl }],
//   missingDataNotice?: string  // 无数据时返回
// }
```

### 2. 编排层 - 槽位策略

```javascript
import { evaluateIntentSignals, shouldAttachBusinessSlot } from 'flight-cabin-recommendation/orchestrator';

// 分析用户意图
const signals = evaluateIntentSignals('帮我推荐到北京的机票');
// { showBusinessUpsell: true, boostBusinessWeight: false }

// 判断是否挂载商务舱
const shouldShow = shouldAttachBusinessSlot(
  { businessAvailable: true, priceGapRatio: 5.8 },
  signals
);
```

**槽位策略规则：**
- 预算信号（最便宜/省钱）：隐藏商务舱
- 舒适信号（舒服/平躺/老人）：提升权重
- 价差>8倍：自动隐藏

### 3. Schema 定义

```javascript
// FlightCard Schema
import flightCardSchema from 'flight-cabin-recommendation/schemas/flight-card' assert { type: 'json' };

// CabinUpsell Schema  
import cabinUpsellSchema from 'flight-cabin-recommendation/schemas/cabin-upsell' assert { type: 'json' };
```

## 数据结构

### FlightCard (航班卡片)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识 |
| slotKey | enum | economy_direct/economy_transfer/business_upsell |
| slotTitle | string | 展示标题 |
| route | object | 出发地/目的地 |
| departDate | string | ISO日期 YYYY-MM-DD |
| priceCny | number | 价格 |
| cabinClass | enum | Y/W/J/C/F |
| airline | object | 航司代码+名称 |

### CabinUpsell (舱位升级)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识 |
| flightCardId | string | 关联FlightCard |
| aircraftKey | string | 机型键如 CX\|A350-1000 |
| facts | object | 座椅数、宽度、评分等 |
| images | array | 图片列表 |
| accordion | array | 折叠区块 |
| cta | object | 行动按钮 |

## 示例数据

CabinKB内置示例数据：
- **CX|A350-1000**: 国泰航空 A350-1000 商务舱
- **MU|A330-300**: 中国东方航空 A330-300 商务舱

## License

MIT
