/**
 * CabinKB：航司 + 机型 -> 事实、图片、折叠区块模板。
 * 无数据时返回显式占位，禁止调用方脑补。
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

let _fixtures = null;
function loadFixtures() {
  if (_fixtures) return _fixtures;
  const raw = readFileSync(join(__dirname, "fixtures.json"), "utf8");
  _fixtures = JSON.parse(raw);
  return _fixtures;
}

/**
 * @param {{ airlineCode: string, equipment: string, subfleet?: string }} q
 * @returns {{ aircraftKey: string, facts: object, images: object[], accordion: object[], missingDataNotice?: string }}
 */
export function getCabinPresentation(q) {
  const code = (q.airlineCode || "").toUpperCase();
  const equipment = (q.equipment || "").trim();
  const key = `${code}|${equipment}`;
  const fixtures = loadFixtures();
  const row = fixtures[key];

  if (!row) {
    return {
      aircraftKey: key,
      facts: {},
      images: [],
      accordion: [
        {
          sectionId: "unknown",
          title: "机型与座椅信息",
          defaultExpanded: true,
          bullets: [],
        },
      ],
      missingDataNotice: `暂无可靠数据（${key}）。请以航司与机场实际公布为准。`,
    };
  }

  const images = row.images || [];
  const accordion = (row.accordionTemplates || []).map((t) => {
    const section = {
      sectionId: t.sectionId,
      title: t.title,
      defaultExpanded: !!t.defaultExpanded,
      bullets: t.bullets || [],
    };
    if (t.usePrimaryImage && images[0]) {
      section.imageUrl = images[0].url;
    }
    return section;
  });

  return {
    aircraftKey: key,
    facts: row.facts || {},
    images,
    accordion,
  };
}

export function makeAircraftKey(airlineCode, equipment) {
  return `${(airlineCode || "").toUpperCase()}|${(equipment || "").trim()}`;
}
