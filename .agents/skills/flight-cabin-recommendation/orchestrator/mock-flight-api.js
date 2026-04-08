/**
 * 模拟并行检索：经济舱直飞 / 中转 + 商务舱（有库存）。
 * 真实环境替换为 FlightAndCabinAPI。
 */

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * @param {{ origin: string, dest: string, date: string, userText?: string }} q
 */
export async function fetchEconomyDirect(q) {
  await delay(20);
  return {
    offerId: uid("Y-DIR"),
    searchId: null,
    slotKey: "economy_direct",
    slotTitle: "方案一：直飞最低价",
    recommendReason: "直飞省时，适合家庭与行李较多的行程。",
    route: {
      originCode: q.origin,
      destCode: q.dest,
      originCity: cityName(q.origin),
      destCity: cityName(q.dest),
    },
    departDate: q.date,
    departTime: "07:30",
    arriveTime: "09:50",
    durationMinutes: 140,
    cabinClass: "Y",
    cabinLabel: "经济舱",
    priceCny: 624,
    currency: "CNY",
    airline: { code: "CX", name: "国泰航空" },
    tags: ["直飞"],
    legs: undefined,
  };
}

export async function fetchEconomyTransfer(q) {
  await delay(15);
  return {
    offerId: uid("Y-TR"),
    searchId: null,
    slotKey: "economy_transfer",
    slotTitle: "方案二：高性价比中转",
    recommendReason: "中转组合更省预算，适合时间弹性较大的出行。",
    route: {
      originCode: q.origin,
      destCode: q.dest,
      originCity: cityName(q.origin),
      destCity: cityName(q.dest),
    },
    departDate: q.date,
    departTime: "08:10",
    arriveTime: "13:40",
    durationMinutes: 330,
    cabinClass: "Y",
    cabinLabel: "经济舱",
    priceCny: 510,
    currency: "CNY",
    airline: { code: "MU", name: "中国东方航空" },
    tags: ["中转"],
    legs: [
      { originCode: q.origin, destCode: "SHA", departTime: "08:10", arriveTime: "09:25", flightNo: "MU5100" },
      { originCode: "SHA", destCode: q.dest, departTime: "11:20", arriveTime: "13:40", flightNo: "MU5101" },
    ],
  };
}

export async function fetchBusinessUpsell(q) {
  await delay(25);
  return {
    offerId: uid("J-DIR"),
    searchId: null,
    slotKey: "business_upsell",
    slotTitle: "方案三：舒适出行",
    recommendReason: "宽体商务舱、全平躺与优先服务，更适合重视休息品质的行程。",
    route: {
      originCode: q.origin,
      destCode: q.dest,
      originCity: cityName(q.origin),
      destCity: cityName(q.dest),
    },
    departDate: q.date,
    departTime: "07:30",
    arriveTime: "09:50",
    durationMinutes: 140,
    cabinClass: "J",
    cabinLabel: "商务舱",
    priceCny: 3624,
    currency: "CNY",
    airline: { code: "CX", name: "国泰航空" },
    tags: ["直飞", "宽体"],
    equipment: "A350-1000",
    legs: undefined,
  };
}

function cityName(code) {
  const m = { HGH: "杭州", PKX: "北京大兴", SHA: "上海" };
  return m[code] || code;
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
