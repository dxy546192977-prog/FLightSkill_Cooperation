/**
 * 槽位策略：模糊需求也尝试商务舱；明确「最便宜」等则隐藏 upsell。
 */

const BUDGET_SIGNALS = /最便宜|最低|预算|学生|省钱|抠|穷游|特价|廉航/i;
const COMFORT_SIGNALS = /舒服|舒适|商务|平躺|老人|小孩|红眼|夜班|出差|累|腰/i;

/**
 * @param {string} userText
 * @returns {{ showBusinessUpsell: boolean, boostBusinessWeight: boolean }}
 */
export function evaluateIntentSignals(userText) {
  const t = userText || "";
  if (BUDGET_SIGNALS.test(t)) {
    return { showBusinessUpsell: false, boostBusinessWeight: false };
  }
  return {
    showBusinessUpsell: true,
    boostBusinessWeight: COMFORT_SIGNALS.test(t),
  };
}

/**
 * @param {{ businessAvailable: boolean, priceGapRatio?: number }} ctx
 * @param {{ showBusinessUpsell: boolean }} signals
 */
export function shouldAttachBusinessSlot(ctx, signals) {
  if (!signals.showBusinessUpsell) return false;
  if (!ctx.businessAvailable) return false;
  if (ctx.priceGapRatio != null && ctx.priceGapRatio > 8) {
    return false;
  }
  return true;
}
