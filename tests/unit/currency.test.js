import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  getCurrencyConfig,
} from "../../src/shared/constants/currencies.js";

describe("currency constants and conversion", () => {
  it("defaults to USD with rate 1.0", () => {
    assert.equal(DEFAULT_CURRENCY, "USD");
    const usd = getCurrencyConfig("USD");
    assert.equal(usd.symbol, "$");
    assert.equal(usd.rate, 1.0);
  });

  it("finds configured currency case-insensitively", () => {
    const eur = getCurrencyConfig("eur");
    assert.equal(eur.code, "EUR");
    assert.equal(eur.symbol, "€");
    assert.ok(eur.rate > 0);
  });

  it("falls back to default currency on unknown codes", () => {
    const unknown = getCurrencyConfig("XYZ");
    assert.equal(unknown.code, "USD");
  });

  it("has valid symbols and positive rates for all currencies", () => {
    assert.ok(CURRENCIES.length > 5);
    for (const c of CURRENCIES) {
      assert.ok(c.code);
      assert.ok(c.symbol);
      assert.ok(c.rate > 0);
      assert.ok(c.flag);
    }
  });
});
