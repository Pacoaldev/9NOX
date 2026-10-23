export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar", rate: 1.0, flag: "🇺🇸" },
  { code: "EUR", symbol: "€", name: "Euro", rate: 0.92, flag: "🇪🇺" },
  { code: "GBP", symbol: "£", name: "British Pound", rate: 0.79, flag: "🇬🇧" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", rate: 155.0, flag: "🇯🇵" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", rate: 7.25, flag: "🇨🇳" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar", rate: 1.38, flag: "🇨🇦" },
  { code: "AUD", symbol: "AU$", name: "Australian Dollar", rate: 1.54, flag: "🇦🇺" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real", rate: 5.50, flag: "🇧🇷" },
  { code: "INR", symbol: "₹", name: "Indian Rupee", rate: 83.5, flag: "🇮🇳" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", rate: 0.90, flag: "🇨🇭" },
];

export const DEFAULT_CURRENCY = "USD";

export function getCurrencyConfig(code = DEFAULT_CURRENCY) {
  const normalized = (code || DEFAULT_CURRENCY).toUpperCase();
  return CURRENCIES.find((c) => c.code === normalized) || CURRENCIES[0];
}
