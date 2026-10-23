"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { RequestLogger, CardSkeleton, SegmentedControl } from "@/shared/components";
import UsageStats from "@/shared/components/UsageStats";
import RequestDetailsTab from "./components/RequestDetailsTab";
import dynamic from "next/dynamic";

const ProviderLimits = dynamic(() => import("./components/ProviderLimits"), {
  ssr: false,
  loading: () => <CardSkeleton />,
});

const PERIODS = [
  { value: "today", label: "Today" },
  { value: "24h", label: "24h" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "60d", label: "60D" },
  { value: "all", label: "All" },
];

const USAGE_TABS = [
  { value: "overview", label: "Overview" },
  { value: "providers", label: "Providers" },
  { value: "models", label: "Models" },
  { value: "limits", label: "Limits" },
  { value: "requests", label: "Requests" },
];

export default function UsagePage() {
  return (
    <Suspense fallback={<CardSkeleton />}>
      <UsageContent />
    </Suspense>
  );
}

function UsageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [period, setPeriod] = useState("today");

  const tabFromUrl = searchParams.get("tab");
  const validTabs = ["overview", "providers", "models", "limits", "requests", "details", "logs"];
  const activeTab = tabFromUrl && validTabs.includes(tabFromUrl)
    ? (tabFromUrl === "details" ? "requests" : tabFromUrl)
    : "overview";

  const handleTabChange = (value) => {
    if (value === activeTab) return;
    const params = new URLSearchParams(searchParams);
    params.set("tab", value);
    router.push(`/dashboard/usage?${params.toString()}`, { scroll: false });
  };

  const showPeriodSelector = ["overview", "providers", "models"].includes(activeTab);

  return (
    <div className="flex min-w-0 flex-col gap-6 px-1 sm:px-0">
      {/* Tabs + period selector on same row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl
          options={USAGE_TABS}
          value={activeTab === "logs" ? "requests" : activeTab}
          onChange={handleTabChange}
          className="w-full sm:w-auto"
        />
        {showPeriodSelector && (
          <SegmentedControl
            options={PERIODS}
            value={period}
            onChange={setPeriod}
            size="sm"
            className="w-full sm:w-auto"
          />
        )}
      </div>

      {activeTab === "overview" && (
        <Suspense fallback={<CardSkeleton />}>
          <UsageStats period={period} setPeriod={setPeriod} hidePeriodSelector section="overview" />
        </Suspense>
      )}
      {activeTab === "providers" && (
        <Suspense fallback={<CardSkeleton />}>
          <UsageStats period={period} setPeriod={setPeriod} hidePeriodSelector section="providers" />
        </Suspense>
      )}
      {activeTab === "models" && (
        <Suspense fallback={<CardSkeleton />}>
          <UsageStats period={period} setPeriod={setPeriod} hidePeriodSelector section="models" />
        </Suspense>
      )}
      {activeTab === "limits" && (
        <Suspense fallback={<CardSkeleton />}>
          <ProviderLimits />
        </Suspense>
      )}
      {activeTab === "logs" && <RequestLogger />}
      {activeTab === "requests" && <RequestDetailsTab />}
    </div>
  );
}
