# 埋点与抽检指标

## 客户端演示页已打点的逻辑事件（控制台 + 页面 log）

| 事件名 | 含义 | 关键字段 |
|--------|------|----------|
| `flight_card_exposure` | 机票卡片曝光 | `slot`, `offerId`, `searchId` |
| `cabin_upsell_exposure` | 商务舱 upsell 区块曝光 | `blockId`, `searchId` |
| `cabin_upsell_render` | 商务舱 UI 渲染完成 | `aircraftKey`, `blockId` |
| `accordion_toggle` | 折叠展开 | `idx`, `open` |
| `cta_click` | 「查看更多」等 CTA 点击 | `href` |
| `stream_done` | SSE 结束 | `reason`, `searchId` |

## 服务端 SSE 可选事件

| `event` | 说明 |
|---------|------|
| `analytics.beacon` | 将 `flight_recommendation_complete` 等同步给客户端或网关 |

生产环境建议接入统一埋点 SDK，并关联 **`searchId` / `offerId`** 做转化漏斗：曝光 → 点击卡片 → 进列表 → 下单。

## 质量抽检

- 运行 `npm run validate`：校验 **JSON Schema** + **槽位策略**（最便宜隐藏商务舱等）。
- **事实错误率**：用 CabinKB 黄金集对比线上返回的 `facts` 字段（可在 `golden-set.json` 扩展 `expectedFacts`）。

## gstack 回归（可选）

启动 `npm start` 后，使用 gstack browse：

1. 打开 `http://127.0.0.1:3847/`
2. 点击「拉取 SSE」，确认三张方案与商务舱折叠、图片加载
3. 点击「模拟：最便宜」，确认仅两张经济舱、无商务舱块
