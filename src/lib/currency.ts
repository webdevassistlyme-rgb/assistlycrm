import type { CurrencyCode } from "../api/systemSettings";

export function formatCurrency(value = 0, currencyCode: CurrencyCode = "USD") {
    return value.toLocaleString("en-US", { style: "currency", currency: currencyCode });
}
