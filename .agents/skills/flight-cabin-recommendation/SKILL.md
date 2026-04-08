---
name: flight-cabin-recommendation
version: 1.0.0
description: |
  对话流航班推荐与商务舱展示系统。提供Schema定义、编排层、SSE流式输出、
  CabinKB机型知识库、槽位策略和QA校验的完整参考实现。
  用于构建智能对话式机票推荐服务。
author: Fliggy Team
license: MIT
---

# Flight Cabin Recommendation

对话流商务舱推荐系统的参考实现，包含完整的Schema定义、编排层、CabinKB机型知识库、
SSE流式输出协议和客户端演示。

## 功能特性

- **Schema定义**: [`FlightCard`](./schemas/flight-card.schema.json) 和 [`CabinUpsell`](./schemas/cabin-upsell.schema.json) 标准JSON Schema
- **编排层**: 并行检索、槽位策略、智能挂载CabinKB
- **CabinKB**: 航司+机型 → 事实、图片、折叠区块模板
- **SSE协议**: 流式文本 + 富媒体块输出
- **客户端演示**: 解析SSE、渲染卡片和手风琴
- **QA校验**: Golden Set验证和事件追踪

## 快速开始

```bash
# 进入skill目录
cd .agents/skills/flight-cabin-recommendation

# 安装依赖
npm install

# 启动服务
npm start
```

浏览器打开 http://127.0.0.1:3847/ 查看演示。

## 项目结构

```
flight-cabin-recommendation/
├── schemas/                    # JSON Schema定义
│   ├── flight-card.schema.json     # 航班卡片Schema
│   ├── cabin-upsell.schema.json    # 舱位升级Schema
│   └── sse-event-envelope.schema.json  # SSE事件Schema
├── cabin-kb/                   # 机型知识库
│   ├── index.js                    # CabinKB查询接口
│   └── fixtures.json               # 示例数据(CX A350-1000等)
├── orchestrator/               # 编排层
│   ├── index.js                    # 主编排逻辑
│   ├── slots.js                    # 槽位策略
│   ├── mock-flight-api.js          # Mock航班API
│   └── server.js                   # HTTP服务器
├── client/                     # 客户端演示
│   └── chat-blocks-demo.html       # H5演示页面
├── qa-metrics/                 # QA校验
│   ├── golden-set.json             # 黄金标准数据
│   ├── validate-blocks.js          # 验证脚本
│   └── events.md                   # 事件定义
├── package.json               # 项目配置
└── README.md                  # 详细文档
```

## 核心概念

### 1. SSE事件流

| 事件名 | 用途 |
|--------|------|
| `message.delta` | 流式纯文本导购 |
| `message.block` | 富媒体块(FlightCard/CabinUpsell) |
| `message.done` | 本轮结束标记 |
| `analytics.beacon` | 可选埋点事件 |

### 2. 槽位策略

系统根据用户意图信号决定是否展示商务舱推荐：

- **预算信号**(`最便宜/最低/预算/省钱`): 隐藏商务舱
- **舒适信号**(`舒服/商务/平躺/老人`): 提升商务舱权重
- **价差阈值**: 价差超过8倍时自动隐藏

### 3. CabinKB

机型知识库查询接口，输入航司代码和机型，返回：
- 事实数据(座椅数、宽度、评分等)
- 图片资源
- 折叠区块模板
- 数据缺失提示(无数据时)

## API使用示例

### 启动推荐流程

```javascript
import { runRecommendationPipeline } from './orchestrator/index.js';

const result = await runRecommendationPipeline({
  userText: "帮我推荐到北京的机票",
  origin: "HGH",
  dest: "PKX",
  date: "2025-04-06"
});

// 返回结果包含:
// - searchId: 搜索ID
// - flightCards: 航班卡片数组
// - cabinUpsells: 舱位升级信息
// - attachBusinessUpsell: 是否挂载商务舱
```

### 转换为SSE序列

```javascript
import { toSSESequence } from './orchestrator/index.js';

const events = toSSESequence(result);
// 生成SSE格式的事件流
```

### CabinKB查询

```javascript
import { getCabinPresentation } from './cabin-kb/index.js';

const kb = getCabinPresentation({
  airlineCode: "CX",
  equipment: "A350-1000"
});
// 返回机型详情、图片、折叠区块
```

## Schema验证

```bash
# 验证Golden Set
npm run validate
```

## 接入真实API

1. 替换 [`orchestrator/mock-flight-api.js`](./orchestrator/mock-flight-api.js) 为真实查价服务
2. 将 [`cabin-kb/fixtures.json`](./cabin-kb/fixtures.json) 替换为数据库或FlightData管道

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `CHAT_FLIGHT_PORT` | 服务端口 | 3847 |

## 技术栈

- Node.js 18+
- 原生ES Modules
- JSON Schema Draft-07
- Server-Sent Events (SSE)

## 协议规范

详见 [`schemas/PROTOCOL.md`](./schemas/PROTOCOL.md)

## License

MIT
