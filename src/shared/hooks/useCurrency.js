"use client";

import { useEffect, useMemo, useCallback } from "react";
import useSettingsStore from "@/store/settingsStore";
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  getCurrencyConfig,
} from "@/shared/constants/currencies";

export function useCurrency() {
  const { settings, fetchSettings, patchSettings } = useSettingsStore();

  useEffect(() => {
    if (!settings) {
      fetchSettings();
    }
  }, [settings, fetchSettings]);

  const currencyCode = settings?.currency || DEFAULT_CURRENCY;

  const currencyConfig = useMemo(() => {
    return getCurrencyConfig(currencyCode);
  }, [currencyCode]);

  const setCurrency = useCallback(
    async (code) => {
      const target = getCurrencyConfig(code).code;
      await patchSettings({ currency: target });
      return target;
    },
    [patchSettings]
  );

  const formatCost = useCallback(
    (amountUsd, { decimals = 2, minimumFractionDigits } = {}) => {
      const num = typeof amountUsd === "number" ? amountUsd : parseFloat(amountUsd) || 0;
      const converted = num * (currencyConfig.rate || 1.0);
      const minDigits = typeof minimumFractionDigits === "number" ? minimumFractionDigits : decimals;

      try {
        return new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: currencyConfig.code,
          minimumFractionDigits: minDigits,
          maximumFractionDigits: decimals,
        }).format(converted);
      } catch {
        return `${currencyConfig.symbol}${converted.toFixed(decimals)}`;
      }
    },
    [currencyConfig]
  );

  return {
    currency: currencyConfig.code,
    currencyConfig,
    currencies: CURRENCIES,
    setCurrency,
    formatCost,
  };
}

export default useCurrency;
