# 对话流 Block 与 SSE 协议

## SSE 事件名（与 `sse-event-envelope.schema.json` 对齐）

| `event` | 用途 |
|---------|------|
| `message.delta` | 流式纯文本导购，`data` 为 `{ "type":"text", "text":"..." }` |
| `message.block` | 富媒体块，`data` 为 `{ "blockType":"FlightCard"|"CabinUpsell", "blockId":"...", "payload":{...} }` |
| `message.done` | 本轮结束 `{ "reason":"complete"|"error", "searchId":"..." }` |
| `analytics.beacon` | 可选埋点，客户端可上报到自己的埋点系统 |

## 传输格式

每条 SSE 消息：

```
event: message.block
data: {"blockType":"FlightCard","blockId":"fc-1","payload":{...}}

```

`data` 行为 **单行 JSON**（不含未转义换行）。若 payload 很大，建议拆为多块或先发 `message.block` 再发文本。

## Payload Schema

- `FlightCard`：见 [flight-card.schema.json](./flight-card.schema.json)
- `CabinUpsell`：见 [cabin-upsell.schema.json](./cabin-upsell.schema.json)

## 渲染顺序建议

1. 先发若干 `message.delta`（开场白可逐字）。
2. 再发 `FlightCard`（经济舱方案一、二）。
3. 再发 `FlightCard`（商务舱）+ `CabinUpsell`（挂 accordion 与图）。
4. 最后 `message.done`。

客户端对 `FlightCard` / `CabinUpsell` 建议 **payload 到齐后整块挂载**，避免半卡片闪烁。
