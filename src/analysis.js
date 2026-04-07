import {
    advanceCycle,
    diffDays,
    formatCurrency,
    formatDate,
    parseDate,
    roundCurrency,
    severityWeight,
    startOfDay,
    sum
} from "./utils.js";

export function convertToBase(settings, amount, currency) {
    const rate = settings.exchangeRates[currency] || 1;
    return roundCurrency(amount * rate);
}

export function getMonthlyCost(settings, subscription) {
    const baseAmount = convertToBase(settings, subscription.amount, subscription.currency);

    switch (subscription.cycle) {
        case "weekly":
            return roundCurrency((baseAmount * 52) / 12);
        case "quarterly":
            return roundCurrency(baseAmount / 3);
        case "yearly":
            return roundCurrency(baseAmount / 12);
        default:
            return roundCurrency(baseAmount);
    }
}

export function getYearlyCost(settings, subscription) {
    return roundCurrency(getMonthlyCost(settings, subscription) * 12);
}

export function getNextPayment(subscriptions) {
    return subscriptions
        .filter((item) => parseDate(item.nextPaymentDate))
        .sort((a, b) => parseDate(a.nextPaymentDate) - parseDate(b.nextPaymentDate))[0] || null;
}

export function buildReminders(subscriptions) {
    const today = startOfDay(new Date());
    const reminders = [];

    subscriptions
        .filter((item) => item.active)
        .forEach((subscription) => {
            const paymentDate = parseDate(subscription.nextPaymentDate);
            if (paymentDate) {
                const days = diffDays(today, paymentDate);
                if (days >= 0 && days <= Math.max(subscription.reminderDaysBefore, 10)) {
                    reminders.push({
                        title: subscription.name,
                        description: `Naechste Zahlung am ${formatDate(subscription.nextPaymentDate)} in ${days} Tag(en).`,
                        tag: days <= 2 ? "Zahlung bald" : "Zahlung",
                        severity: days <= 2 ? "danger" : "info"
                    });
                }
            }

            const deadline = parseDate(subscription.cancelDeadline);
            if (deadline) {
                const days = diffDays(today, deadline);
                if (days >= 0 && days <= Math.max(subscription.reminderDaysBefore, 14)) {
                    reminders.push({
                        title: subscription.name,
                        description: `Kuendigungsfrist endet am ${formatDate(subscription.cancelDeadline)} in ${days} Tag(en).`,
                        tag: days <= 3 ? "Frist kritisch" : "Frist",
                        severity: days <= 3 ? "danger" : "warning"
                    });
                }
            }
        });

    return reminders.sort((a, b) => severityWeight(b.severity) - severityWeight(a.severity));
}

export function scoreSavingsPotential(settings, subscription) {
    const monthlyCost = getMonthlyCost(settings, subscription);
    return monthlyCost * 2 + (10 - subscription.valueScore) * 3 + Math.max(0, 5 - subscription.usageCount);
}

export function getSavingsCandidates(settings, subscriptions) {
    return subscriptions
        .filter((item) => item.active)
        .filter((item) => {
            const monthlyCost = getMonthlyCost(settings, item);
            return monthlyCost >= 10 && (item.usageCount <= 3 || item.valueScore <= 5);
        })
        .sort((a, b) => scoreSavingsPotential(settings, b) - scoreSavingsPotential(settings, a));
}

export function buildSavingsItem(settings, subscription) {
    const monthly = getMonthlyCost(settings, subscription);
    const yearly = getYearlyCost(settings, subscription);
    const deadline = parseDate(subscription.cancelDeadline);

    return {
        title: subscription.name,
        description: `${formatCurrency(monthly, settings.baseCurrency)} pro Monat · Nutzen ${subscription.valueScore}/10 · ${subscription.usageCount} Nutzungen`,
        tag: `${formatCurrency(yearly, settings.baseCurrency)} / Jahr`,
        severity: deadline && diffDays(startOfDay(new Date()), deadline) <= 7 ? "danger" : "warning"
    };
}

export function buildReflection(settings, subscription) {
    const monthly = getMonthlyCost(settings, subscription);
    const valuePerUse = subscription.usageCount > 0 ? monthly / subscription.usageCount : monthly;

    if (subscription.valueScore >= 8 && subscription.usageCount >= 8) {
        return "Dieses Abo liefert hohen Nutzen und wird haeufig verwendet. Behalten ist naheliegend.";
    }

    if (subscription.valueScore <= 5 && subscription.usageCount <= 3) {
        return `Der Nutzen wirkt schwach. Jede Nutzung kostet dich rechnerisch ${formatCurrency(valuePerUse, settings.baseCurrency)}. Pruefen oder kuendigen lohnt sich.`;
    }

    return "Mittleres Profil: nicht sofort kuendigen, aber nach naechster Abrechnung aktiv bewerten.";
}

export function buildTwelveMonthProjection(settings, subscriptions) {
    const today = startOfDay(new Date());
    const months = [];

    for (let offset = 0; offset < 12; offset++) {
        const date = new Date(today.getFullYear(), today.getMonth() + offset, 1);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const total = subscriptions
            .filter((item) => item.active)
            .reduce((sumValue, item) => sumValue + getProjectedCostForMonth(settings, item, monthStart, monthEnd), 0);

        months.push({
            label: monthStart.toLocaleDateString("de-DE", { month: "short" }),
            total: roundCurrency(total)
        });
    }

    return months;
}

export function getProjectedCostForMonth(settings, subscription, monthStart, monthEnd) {
    const next = parseDate(subscription.nextPaymentDate);
    if (!next) {
        return 0;
    }

    const converted = convertToBase(settings, subscription.amount, subscription.currency);
    let cursor = new Date(next);
    let total = 0;
    let guard = 0;

    while (cursor <= monthEnd && guard < 24) {
        if (cursor >= monthStart) {
            total += converted;
        }
        cursor = advanceCycle(cursor, subscription.cycle);
        guard += 1;
    }

    return roundCurrency(total);
}

export function groupByCategory(subscriptions) {
    return subscriptions
        .filter((item) => item.active)
        .reduce((grouped, item) => {
            if (!grouped[item.category]) {
                grouped[item.category] = [];
            }
            grouped[item.category].push(item);
            return grouped;
        }, {});
}

export function getReminderSummary(subscription) {
    const deadline = parseDate(subscription.cancelDeadline);
    if (deadline) {
        const days = diffDays(startOfDay(new Date()), deadline);
        if (days >= 0 && days <= 7) {
            return `Kuendigungsfrist endet in ${days} Tagen.`;
        }
    }

    return subscription.autoRenew ? "Automatische Verlaengerung aktiv." : "Keine automatische Verlaengerung.";
}

export function getFilteredSubscriptions(subscriptions, filters, settings) {
    const filtered = subscriptions.filter((subscription) => {
        const matchesSearch = !filters.search
            || subscription.name.toLowerCase().includes(filters.search)
            || (subscription.notes || "").toLowerCase().includes(filters.search);
        const matchesCategory = filters.category === "all" || subscription.category === filters.category;
        const matchesStatus = filters.status === "all"
            || (filters.status === "active" && subscription.active)
            || (filters.status === "inactive" && !subscription.active);

        return matchesSearch && matchesCategory && matchesStatus;
    });

    return filtered.sort((a, b) => compareSubscriptions(a, b, filters.sort, settings));
}

export function compareSubscriptions(a, b, sort, settings) {
    switch (sort) {
        case "amountDesc":
            return getMonthlyCost(settings, b) - getMonthlyCost(settings, a);
        case "amountAsc":
            return getMonthlyCost(settings, a) - getMonthlyCost(settings, b);
        case "name":
            return a.name.localeCompare(b.name, "de");
        case "valueScore":
            return b.valueScore - a.valueScore;
        default:
            return (parseDate(a.nextPaymentDate) || new Date(8640000000000000)) - (parseDate(b.nextPaymentDate) || new Date(8640000000000000));
    }
}

export function getDashboardMetrics(state) {
    const activeSubscriptions = state.subscriptions.filter((item) => item.active);
    const monthlyTotal = sum(activeSubscriptions.map((item) => getMonthlyCost(state.settings, item)));
    const yearlyTotal = sum(activeSubscriptions.map((item) => getYearlyCost(state.settings, item)));
    const reminders = buildReminders(state.subscriptions);
    const savings = getSavingsCandidates(state.settings, state.subscriptions);

    return {
        activeSubscriptions,
        monthlyTotal,
        yearlyTotal,
        reminders,
        savings,
        nextPayment: getNextPayment(activeSubscriptions)
    };
}
