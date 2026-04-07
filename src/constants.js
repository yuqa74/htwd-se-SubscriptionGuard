export const STORAGE_KEY = "subscription-guard-state-v1";

export const CSV_FIELDS = [
    "name",
    "category",
    "amount",
    "currency",
    "cycle",
    "nextPaymentDate",
    "startDate",
    "endDate",
    "cancelDeadline",
    "reminderDaysBefore",
    "usageCount",
    "valueScore",
    "autoRenew",
    "active",
    "notes"
];

export const DEFAULT_SETTINGS = {
    monthlyBudget: 0,
    baseCurrency: "EUR",
    exchangeRates: {
        EUR: 1,
        USD: 0.93,
        GBP: 1.16,
        CHF: 1.04
    }
};

export const DEFAULT_STATE = {
    subscriptions: [],
    settings: DEFAULT_SETTINGS
};
