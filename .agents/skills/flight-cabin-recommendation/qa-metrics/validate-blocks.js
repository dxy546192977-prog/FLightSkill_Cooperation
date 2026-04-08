#!/usr/bin/env node
/**
 * 使用 Ajv 校验 golden-set 与编排层实时输出。
 */

import Ajv from "ajv";
import addFormats from "ajv-formats";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runRecommendationPipeline } from "../orchestrator/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const flightSchema = JSON.parse(
  readFileSync(path.join(ROOT, "schemas/flight-card.schema.json"), "utf8")
);
const cabinSchema = JSON.parse(
  readFileSync(path.join(ROOT, "schemas/cabin-upsell.schema.json"), "utf8")
);

const validateFlight = ajv.compile(flightSchema);
const validateCabin = ajv.compile(cabinSchema);

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function validateGoldenSnapshot() {
  const goldenPath = path.join(__dirname, "golden-set.json");
  const golden = JSON.parse(readFileSync(goldenPath, "utf8"));
  for (const card of golden.snapshot.flightCards) {
    const ok = validateFlight(card);
    if (!ok) {
      console.error("FlightCard golden errors:", validateFlight.errors);
      throw new Error("FlightCard golden invalid");
    }
  }
  const okC = validateCabin(golden.snapshot.cabinUpsell);
  if (!okC) {
    console.error("CabinUpsell golden errors:", validateCabin.errors);
    throw new Error("CabinUpsell golden invalid");
  }
  console.log("golden-set snapshot: OK");
}

async function validateLivePipeline() {
  const goldenPath = path.join(__dirname, "golden-set.json");
  const golden = JSON.parse(readFileSync(goldenPath, "utf8"));

  for (const sc of golden.scenarios) {
    const r = await runRecommendationPipeline({
      userText: sc.userText,
      origin: "HGH",
      dest: "PKX",
      date: "2025-04-06",
    });
    assert(
      r.attachBusinessUpsell === sc.expectAttachBusinessUpsell,
      `scenario ${sc.id} attachBusinessUpsell expected ${sc.expectAttachBusinessUpsell} got ${r.attachBusinessUpsell}`
    );
    assert(
      r.flightCards.length >= sc.minFlightCards,
      `scenario ${sc.id} flightCards min ${sc.minFlightCards} got ${r.flightCards.length}`
    );
    assert(
      r.cabinUpsells.length >= sc.minCabinUpsells,
      `scenario ${sc.id} cabinUpsells min ${sc.minCabinUpsells} got ${r.cabinUpsells.length}`
    );
    if (sc.expectAircraftKey && r.cabinUpsells[0]) {
      assert(
        r.cabinUpsells[0].aircraftKey === sc.expectAircraftKey,
        `scenario ${sc.id} aircraftKey expected ${sc.expectAircraftKey} got ${r.cabinUpsells[0].aircraftKey}`
      );
    }
    for (const card of r.flightCards) {
      if (!validateFlight(card)) {
        console.error(validateFlight.errors);
        throw new Error(`FlightCard invalid in scenario ${sc.id}`);
      }
    }
    for (const c of r.cabinUpsells) {
      if (!validateCabin(c)) {
        console.error(validateCabin.errors);
        throw new Error(`CabinUpsell invalid in scenario ${sc.id}`);
      }
    }
    console.log("pipeline scenario:", sc.id, "OK");
  }
}

try {
  validateGoldenSnapshot();
  await validateLivePipeline();
  console.log("\nvalidate-blocks: ALL OK");
  process.exit(0);
} catch (e) {
  console.error("\nvalidate-blocks: FAIL", e.message);
  process.exit(1);
}
