/**
 * 编排层工具函数
 * 提供推荐结果组装、SSE序列化和槽位策略
 */

import { evaluateIntentSignals, shouldAttachBusinessSlot } from "./slots.js";

export { evaluateIntentSignals, shouldAttachBusinessSlot };

/**
 * 构建航班卡片数据
 * @param {Object} params
 * @returns {Object} FlightCard格式数据
 */
export function buildFlightCard(params) {
  const {
    id,
    slotKey,
    slotTitle,
    recommendReason,
    route,
    departDate,
    departTime,
    arriveTime,
    durationMinutes,
    cabinClass,
    cabinLabel,
    priceCny,
    airline,
    tags = [],
    legs,
    offerId,
    searchId,
  } = params;

  return {
    id,
    slotKey,
    slotTitle,
    recommendReason,
    route,
    departDate,
    departTime,
    arriveTime,
    durationMinutes,
    cabinClass,
    cabinLabel,
    priceCny,
    currency: "CNY",
    airline,
    tags,
    legs,
    offerId,
    searchId,
  };
}

/**
 * 构建舱位升级数据
 * @param {Object} params
 * @param {Object} cabinKb CabinKB查询结果
 * @returns {Object} CabinUpsell格式数据
 */
export function buildCabinUpsell(params, cabinKb) {
  const { id, flightCardId, cta, searchId } = params;

  return {
    id,
    flightCardId,
    aircraftKey: cabinKb.aircraftKey,
    facts: cabinKb.facts || {},
    images: cabinKb.images || [],
    accordion: cabinKb.accordion || [],
    missingDataNotice: cabinKb.missingDataNotice,
    cta,
    searchId,
  };
}

/**
 * 构建推荐开场文案
 * @param {boolean} attachBiz 是否挂载商务舱
 * @param {{showBusinessUpsell: boolean}} signals 意图信号
 * @returns {string}
 */
export function buildIntroText(attachBiz, signals) {
  if (!attachBiz && !signals.showBusinessUpsell) {
    return "根据你的偏好，我优先整理了更省预算的经济舱组合；若之后想升级体验，也可以再说。";
  }
  if (attachBiz) {
    return "下面为你准备了直飞低价、高性价比中转，以及更舒适的商务舱方案，可按需对比。";
  }
  return "下面为你整理了直飞与中转的经济舱方案；如需更舒适出行可告诉我。";
}

/**
 * 将推荐结果转为SSE事件序列
 * @param {Object} result 推荐结果
 * @returns {Array<{event: string, data: Object}>} SSE事件列表
 */
export function toSSESequence(result) {
  const events = [];
  const chunks = chunkText(result.introText, 24);

  for (const text of chunks) {
    events.push({ event: "message.delta", data: { type: "text", text } });
  }

  for (const card of result.flightCards || []) {
    events.push({
      event: "message.block",
      data: { blockType: "FlightCard", blockId: card.id, payload: card },
    });
  }

  for (const cabin of result.cabinUpsells || []) {
    events.push({
      event: "message.block",
      data: { blockType: "CabinUpsell", blockId: cabin.id, payload: cabin },
    });
  }

  events.push({
    event: "message.done",
    data: { reason: "complete", searchId: result.searchId },
  });

  return events;
}

function chunkText(s, size) {
  if (!s) return [""];
  const out = [];
  for (let i = 0; i < s.length; i += size) {
    out.push(s.slice(i, i + size));
  }
  return out;
}
