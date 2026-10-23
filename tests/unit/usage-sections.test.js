import test, { describe, it } from "node:test";
import assert from "node:assert/strict";

const USAGE_TABS = [
  { value: "overview", label: "Overview" },
  { value: "providers", label: "Providers" },
  { value: "models", label: "Models" },
  { value: "limits", label: "Limits" },
  { value: "requests", label: "Requests" },
];

function resolveActiveTab(tabFromUrl) {
  const validTabs = ["overview", "providers", "models", "limits", "requests", "details", "logs"];
  if (!tabFromUrl || !validTabs.includes(tabFromUrl)) return "overview";
  if (tabFromUrl === "details" || tabFromUrl === "logs") return "requests";
  return tabFromUrl;
}

describe("usage dashboard tabs and section resolution", () => {
  it("defaults to overview when url tab is omitted or invalid", () => {
    assert.equal(resolveActiveTab(null), "overview");
    assert.equal(resolveActiveTab(""), "overview");
    assert.equal(resolveActiveTab("nonexistent"), "overview");
  });

  it("resolves all defined tabs correctly", () => {
    for (const tab of USAGE_TABS) {
      assert.equal(resolveActiveTab(tab.value), tab.value);
    }
  });

  it("maps legacy details/logs url params to requests tab", () => {
    assert.equal(resolveActiveTab("details"), "requests");
    assert.equal(resolveActiveTab("logs"), "requests");
  });

  it("has exactly 5 primary user-facing tabs", () => {
    assert.equal(USAGE_TABS.length, 5);
  });
});
