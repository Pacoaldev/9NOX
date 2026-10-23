import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getProviderModels, PROVIDER_ID_TO_ALIAS } from "../../open-sse/config/providerModels.js";

async function mapConcurrent(items, limit, fn) {
  const results = new Array(items.length);
  let index = 0;
  let activeWorkers = 0;
  let maxConcurrentObserved = 0;

  const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (index < items.length) {
      const current = index++;
      activeWorkers++;
      if (activeWorkers > maxConcurrentObserved) {
        maxConcurrentObserved = activeWorkers;
      }
      try {
        results[current] = await fn(items[current], current);
      } finally {
        activeWorkers--;
      }
    }
  });
  await Promise.all(workers);
  return { results, maxConcurrentObserved };
}

describe("batch model testing bounded concurrency", () => {
  it("never exceeds concurrency limit", async () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const limit = 4;
    const { results, maxConcurrentObserved } = await mapConcurrent(items, limit, async (item) => {
      await new Promise((r) => setTimeout(r, 10));
      return item * 2;
    });

    assert.equal(results.length, 10);
    assert.deepEqual(results, [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
    assert.ok(maxConcurrentObserved <= limit, `Expected max ${limit}, got ${maxConcurrentObserved}`);
    assert.ok(maxConcurrentObserved > 1, "Should run concurrently");
  });

  it("handles empty items array gracefully", async () => {
    const { results, maxConcurrentObserved } = await mapConcurrent([], 4, async () => 1);
    assert.equal(results.length, 0);
    assert.equal(maxConcurrentObserved, 0);
  });

  it("resolves provider models for common providers", () => {
    const openaiAlias = PROVIDER_ID_TO_ALIAS["openai"] || "openai";
    const openaiModels = getProviderModels(openaiAlias);
    assert.ok(Array.isArray(openaiModels));
    assert.ok(openaiModels.length > 0);
    assert.ok(openaiModels.some((m) => m.id.includes("gpt")));
  });
});
