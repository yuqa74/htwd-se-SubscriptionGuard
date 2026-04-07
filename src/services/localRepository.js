import { DEFAULT_STATE } from "../constants.js";
import { clone, createId, toInputDate } from "../utils.js";

export function loadLocalState(storageKey) {
    try {
        const stored = localStorage.getItem(storageKey);
        if (!stored) {
            return clone(DEFAULT_STATE);
        }

        return sanitizeState(JSON.parse(stored));
    } catch {
        return clone(DEFAULT_STATE);
    }
}

export function saveLocalState(storageKey, state) {
    localStorage.setItem(storageKey, JSON.stringify(state));
}

export function sanitizeState(raw) {
    const safe = clone(DEFAULT_STATE);
    safe.settings.monthlyBudget = Number(raw.settings?.monthlyBudget || 0);
    safe.settings.baseCurrency = raw.settings?.baseCurrency || "EUR";
    safe.settings.exchangeRates = {
        EUR: Number(raw.settings?.exchangeRates?.EUR || 1),
        USD: Number(raw.settings?.exchangeRates?.USD || 0.93),
        GBP: Number(raw.settings?.exchangeRates?.GBP || 1.16),
        CHF: Number(raw.settings?.exchangeRates?.CHF || 1.04)
    };
    safe.subscriptions = Array.isArray(raw.subscriptions)
        ? raw.subscriptions.map((item) => ({
            id: item.id || createId(),
            name: item.name || "Unbenanntes Abo",
            category: item.category || "Sonstiges",
            amount: Number(item.amount || 0),
            currency: item.currency || "EUR",
            cycle: item.cycle || "monthly",
            nextPaymentDate: item.nextPaymentDate || toInputDate(new Date()),
            startDate: item.startDate || "",
            endDate: item.endDate || "",
            cancelDeadline: item.cancelDeadline || "",
            reminderDaysBefore: Number(item.reminderDaysBefore || 7),
            usageCount: Number(item.usageCount || 0),
            valueScore: Number(item.valueScore || 5),
            autoRenew: item.autoRenew !== false && item.autoRenew !== "false",
            active: item.active !== false && item.active !== "false",
            notes: item.notes || ""
        }))
        : [];

    return safe;
}
