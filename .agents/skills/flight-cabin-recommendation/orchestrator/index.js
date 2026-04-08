/**
 * 编排：并行 Y + 商务检索，槽位策略，挂载 CabinKB。
 */

import { getCabinPresentation } from "../cabin-kb/index.js";
import { evaluateIntentSignals, shouldAttachBusinessSlot } from "./slots.js";
import * as MockApi from "./mock-flight-api.js";

/**
 * @param {{
 *   userText: string,
 *   origin?: string,
 *   dest?: string,
 *   date?: string,
 * }} input
 */
export async function runRecommendationPipeline(input) {
  const origin = input.origin || "HGH";
  const dest = input.dest || "PKX";
  const date = input.date || "2025-04-06";
  const searchId = `srch-${Date.now().toString(36)}`;

  const signals = evaluateIntentSignals(input.userText || "");

  const [directY, transferY, businessRaw] = await Promise.all([
    MockApi.fetchEconomyDirect({ origin, dest, date, userText: input.userText }),
    MockApi.fetchEconomyTransfer({ origin, dest, date, userText: input.userText }),
    MockApi.fetchBusinessUpsell({ origin, dest, date, userText: input.userText }),
  ]);

  directY.searchId = searchId;
  transferY.searchId = searchId;
  businessRaw.searchId = searchId;

  const economyCheapest = Math.min(directY.priceCny, transferY.priceCny);
  const priceGapRatio = businessRaw.priceCny / economyCheapest;

  const businessAvailable = true;
  const attachBiz = shouldAttachBusinessSlot(
    { businessAvailable, priceGapRatio },
    signals
  );

  /** @type {object[]} */
  const flightCards = [];
  flightCards.push(toFlightCardPayload(directY));
  flightCards.push(toFlightCardPayload(transferY));

  /** @type {object[]} */
  const cabinBlocks = [];

  if (attachBiz) {
    flightCards.push(toFlightCardPayload(businessRaw));
    const kb = getCabinPresentation({
      airlineCode: businessRaw.airline.code,
      equipment: businessRaw.equipment || "A350-1000",
    });
    cabinBlocks.push({
      id: `cabin-${businessRaw.offerId}`,
      flightCardId: cardIdForOffer(businessRaw),
      aircraftKey: kb.aircraftKey,
      facts: kb.facts,
      images: kb.images,
      accordion: kb.accordion,
      missingDataNotice: kb.missingDataNotice,
      cta: {
        label: "查看更多商务舱优选",
        href: `https://example.com/flights?searchId=${encodeURIComponent(searchId)}&cabin=J`,
        offerId: businessRaw.offerId,
        searchId,
      },
      searchId,
    });
  }

  return {
    searchId,
    signals,
    attachBusinessUpsell: attachBiz,
    flightCards,
    cabinUpsells: cabinBlocks,
    introText: buildIntroText(attachBiz, signals),
  };
}

function cardIdForOffer(row) {
  return `fc-${row.slotKey}-${row.offerId}`;
}

function toFlightCardPayload(row) {
  return {
    id: cardIdForOffer(row),
    slotKey: row.slotKey,
    slotTitle: row.slotTitle,
    recommendReason: row.recommendReason,
    route: row.route,
    departDate: row.departDate,
    departTime: row.departTime,
    arriveTime: row.arriveTime,
    durationMinutes: row.durationMinutes,
    cabinClass: row.cabinClass,
    cabinLabel: row.cabinLabel,
    priceCny: row.priceCny,
    currency: row.currency,
    airline: row.airline,
    tags: row.tags,
    legs: row.legs,
    offerId: row.offerId,
    searchId: row.searchId,
  };
}

function buildIntroText(attachBiz, signals) {
  if (!attachBiz && !signals.showBusinessUpsell) {
    return "根据你的偏好，我优先整理了更省预算的经济舱组合；若之后想升级体验，也可以再说。";
  }
  if (attachBiz) {
    return "下面为你准备了直飞低价、高性价比中转，以及更舒适的商务舱方案，可按需对比。";
  }
  return "下面为你整理了直飞与中转的经济舱方案；如需更舒适出行可告诉我。";
}

/**
 * 将 pipeline 结果转为 SSE 事件列表（已序列化的 data 对象）。
 */
export function toSSESequence(result) {
  const events = [];
  const chunks = chunkText(result.introText, 24);
  for (const text of chunks) {
    events.push({ event: "message.delta", data: { type: "text", text } });
  }
  for (const card of result.flightCards) {
    events.push({
      event: "message.block",
      data: { blockType: "FlightCard", blockId: card.id, payload: card },
    });
  }
  for (const cabin of result.cabinUpsells) {
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
