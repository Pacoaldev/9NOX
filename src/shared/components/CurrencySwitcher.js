"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { getCurrencyConfig } from "@/shared/constants/currencies";
import { useCurrency } from "@/shared/hooks/useCurrency";

export default function CurrencySwitcher({
  className = "",
  isOpen: controlledOpen,
  onClose,
  hideTrigger = false,
}) {
  const { currency, setCurrency, currencies } = useCurrency();
  const [internalOpen, setInternalOpen] = useState(false);
  const modalRef = useRef(null);

  const isControlled = typeof controlledOpen === "boolean";
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = (value, nextCurrency = currency) => {
    if (isControlled) {
      if (!value && onClose) onClose(nextCurrency);
    } else {
      setInternalOpen(value);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = async (code) => {
    await setCurrency(code);
    setIsOpen(false, code);
  };

  const currentInfo = getCurrencyConfig(currency);

  return (
    <div className={className}>
      {!hideTrigger && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-text-muted hover:text-text-main hover:bg-surface/60 transition-colors"
          title="Currency"
        >
          <span className="material-symbols-outlined text-[20px]">payments</span>
          <span className="text-sm font-medium">
            {currentInfo.code} ({currentInfo.symbol})
          </span>
          <span className="text-lg">{currentInfo.flag}</span>
        </button>
      )}

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <div
              ref={modalRef}
              className="relative w-full bg-surface border border-black/10 dark:border-white/10 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-w-lg flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between p-3 border-b border-black/5 dark:border-white/5">
                <h2 className="text-lg font-semibold text-text-main">Select Currency</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-text-muted hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  aria-label="Close"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {currencies.map((item) => {
                    const active = currency === item.code;
                    return (
                      <button
                        key={item.code}
                        onClick={() => handleSelect(item.code)}
                        className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg text-xs font-medium transition-all ${
                          active
                            ? "bg-primary/15 text-primary ring-2 ring-primary"
                            : "text-text-main hover:bg-black/5 dark:hover:bg-white/5 border border-border/40"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-xl">{item.flag}</span>
                          <span className="text-sm font-bold">{item.code}</span>
                        </div>
                        <span className="text-text-muted text-[11px] truncate">{item.name}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-black/5 dark:bg-white/5">
                          {item.symbol}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
